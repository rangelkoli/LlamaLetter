export const createCoverLetterPrompt = (
  resume: string,
  jobDescription: string,
  companyName: string
): string => {
  return `
As a professional cover letter writer, create a compelling cover letter for a job application with the following components:

1. ATTENTION HOOK (First Paragraph):
   Create an engaging opening that addresses specific daily challenges mentioned in the job description. Make it relevant to the role and company.

2. BODY (2-3 Paragraphs):
   - Connect the applicant's skills and experiences from their resume to the job requirements
   - Highlight relevant accomplishments and how they align with company needs
   - Explain the value the applicant would bring to the company

3. CLOSING:
   - Express enthusiasm for the opportunity
   - Include a call to action

FORMAT: Start with a standard business letter format, including today's date.

INFORMATION:
Company: ${companyName}
Resume: ${resume}
Job Description: ${jobDescription}

THE COVER LETTER SHOULD BE PERSONALIZED, PROFESSIONAL, AND CONCISE (1 PAGE MAXIMUM).
`;
};
