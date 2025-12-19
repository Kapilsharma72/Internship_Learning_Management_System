import api from "./api";

export const downloadCertificate = async (courseId) => {
  const res = await api.get(`/certificates/${courseId}`, {
    responseType: "blob"
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "certificate.pdf");
  document.body.appendChild(link);
  link.click();
};
