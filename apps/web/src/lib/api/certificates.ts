import { apiClient } from './client';

export interface CertificateVerification {
  isValid: boolean;
  certificateNo: string;
  studentName: string;
  courseTitle: string;
  teacherName: string;
  issuedAt: string;
}

export async function verifyCertificate(
  certificateNo: string,
): Promise<CertificateVerification> {
  const { data } = await apiClient.get(`/certificates/verify/${certificateNo}`);
  return data.data;
}
