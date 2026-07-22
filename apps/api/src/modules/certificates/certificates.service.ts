import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { BadgeCode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly achievements: AchievementsService,
  ) {}

  /**
   * Issues a certificate once a student has completed a course
   * (100% lesson progress) and, if the course has a final exam,
   * has passed it. Generates a PDF with an embedded QR code that
   * links to the public verification page.
   */
  async issueCertificate(studentId: string, courseId: string) {
    const existing = await this.prisma.certificate.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {
      throw new ConflictException('Certificate already issued for this course');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: { course: { include: { exams: true } } },
    });
    if (!enrollment) {
      throw new NotFoundException('You are not enrolled in this course');
    }
    if (!enrollment.completedAt) {
      throw new BadRequestException(
        'You must complete 100% of the course lessons before receiving a certificate',
      );
    }

    // If the course has a final exam, require a passing attempt
    const finalExam = enrollment.course.exams[0];
    let examId: string | undefined;
    if (finalExam) {
      const passedAttempt = await this.prisma.examAttempt.findFirst({
        where: { examId: finalExam.id, studentId, isPassed: true },
      });
      if (!passedAttempt) {
        throw new BadRequestException(
          'You must pass the course final exam before receiving a certificate',
        );
      }
      examId = finalExam.id;
    }

    const certificate = await this.prisma.certificate.create({
      data: {
        studentId,
        courseId,
        examId,
        qrVerificationUrl: '', // filled in below once we have the certificateNo
      },
    });

    const clientUrl = this.config.get<string>('app.clientUrl');
    const verificationUrl = `${clientUrl}/verify-certificate/${certificate.certificateNo}`;

    const pdfUrl = await this.generateCertificatePdf(
      certificate.id,
      certificate.certificateNo,
      verificationUrl,
    );

    await this.achievements
      .awardBadge(studentId, BadgeCode.FIRST_CERTIFICATE)
      .catch(() => undefined);

    return this.prisma.certificate.update({
      where: { id: certificate.id },
      data: { qrVerificationUrl: verificationUrl, pdfUrl },
    });
  }

  async findMyCertificates(studentId: string) {
    return this.prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
      include: {
        course: { select: { titleAr: true, thumbnailUrl: true } },
      },
    });
  }

  /**
   * Public verification lookup — anyone with the certificate number
   * (e.g. an employer scanning the QR code) can confirm authenticity
   * without needing to log in.
   */
  async verifyByCertificateNo(certificateNo: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateNo },
      include: {
        student: { select: { fullName: true } },
        course: { select: { titleAr: true, teacher: { select: { fullName: true } } } },
      },
    });
    if (!certificate) {
      throw new NotFoundException('Certificate not found — this may not be a valid certificate number');
    }
    return {
      isValid: true,
      certificateNo: certificate.certificateNo,
      studentName: certificate.student.fullName,
      courseTitle: certificate.course.titleAr,
      teacherName: certificate.course.teacher.fullName,
      issuedAt: certificate.issuedAt,
    };
  }

  // -----------------------------------------------------------------
  // PDF Generation
  // -----------------------------------------------------------------
  private async generateCertificatePdf(
    certificateId: string,
    certificateNo: string,
    verificationUrl: string,
  ): Promise<string> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        student: { select: { fullName: true } },
        course: {
          select: { titleAr: true, teacher: { select: { fullName: true } } },
        },
      },
    });
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 200 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    doc
      .rect(0, 0, doc.page.width, doc.page.height)
      .fill('#0f172a');

    doc
      .fillColor('#ffffff')
      .fontSize(36)
      .text('Certificate of Completion', 0, 100, { align: 'center' });

    doc
      .fontSize(20)
      .fillColor('#cbd5e1')
      .text('This certifies that', 0, 170, { align: 'center' });

    doc
      .fontSize(30)
      .fillColor('#facc15')
      .text(certificate.student.fullName, 0, 210, { align: 'center' });

    doc
      .fontSize(18)
      .fillColor('#cbd5e1')
      .text(
        `has successfully completed the course "${certificate.course.titleAr}"`,
        80,
        260,
        { align: 'center', width: doc.page.width - 160 },
      );

    doc
      .fontSize(14)
      .fillColor('#94a3b8')
      .text(`Instructor: ${certificate.course.teacher.fullName}`, 0, 320, {
        align: 'center',
      });

    doc.image(qrBuffer, doc.page.width - 180, doc.page.height - 180, {
      width: 120,
      height: 120,
    });

    doc
      .fontSize(10)
      .fillColor('#94a3b8')
      .text(`Certificate No: ${certificateNo}`, 40, doc.page.height - 60);

    doc.end();

    await new Promise<void>((resolve) => doc.on('end', () => resolve()));
    const pdfBuffer = Buffer.concat(buffers);

    // TODO: upload `pdfBuffer` to S3/Cloudinary via the Uploads module and
    // return the resulting public URL. Storing locally is a placeholder
    // for local development only.
    const placeholderUrl = `/certificates/${certificateNo}.pdf`;
    void pdfBuffer; // avoid unused-var lint warning until upload wiring lands

    return placeholderUrl;
  }
}
