
import {GoogleGenAI} from '@google/genai';

// Create a function to generate cover letter using Vertex AI Gemini API
export const generateCoverLetter = async (
  resume: string,
  jobDescription: string,
  companyName: string,
  onProgress: (content: string) => void
) => {

    const prompt = `You are a professional career coach specializing in creating compelling cover letters. Generate a personalized cover letter based on the candidate's resume and the job description.

    INPUT DATA:
    Job Description: ${jobDescription}
    Company Name: ${companyName}
    Resume: ${resume}
    
    COVER LETTER STRUCTURE:
    1. ATTENTION HOOK (1-2 sentences):
       - Identify the most impressive and relevant achievement/skill from the resume that matches a key requirement in the job description
       - Create a compelling opening that showcases the candidate's passion and unique value proposition
       - Keep it specific and achievement-focused
    
    2. BODY (2 paragraphs):
       - Paragraph 1: Detail 2 key qualifications from the resume that directly address requirements in the job description. Use specific examples and metrics when available.
       - Paragraph 2: Explain how these skills and experiences would help solve challenges mentioned in the job description or common in this type of role.
    
    3. CLOSING (1 paragraph):
       - Summarize interest in the position and alignment with company goals/values
       - Express enthusiasm for discussing the opportunity further
       - Include a clear call to action
    
    TONE AND STYLE:
    - Professional but conversational
    - Confident without being arrogant
    - Enthusiastic and positive
    - Focused on value the candidate brings, not what they want from the company
    
    FORMAT REQUIREMENTS:
    - Add salutation or signature line
    - Dont add extra line spacing for the salutation or signature(Just include 1 \n and not \n\n)
    - Use proper grammar and spelling
    - Ensure the letter flows logically from one section to the next
    - No more than 300-400 words total
    - Use proper paragraph breaks
    - Avoid generic statements that could apply to any job
    - Don't explicitly label sections ("Introduction," "Body," etc.)
    - Get the candidate's name, email, phone number, and the date from the resume
    - Use the candidate's name in the salutation
    - Include the company name in the opening sentence
    
    OUTPUT FORMAT:
    [Name]\n
    [Email]\n
    [Phone Number]\n
    [Date]\n
    [The complete cover letter with all sections, formatted as specified above]
    [Salutation]\n
    [Signature Line]\n


    Example Output:
    Rangel Anselm Koli\n rangelkoli@gmail.com\n +1 315-374-9529\n October 26, 2024\n Dear Hiring Manager, I am writing to express my enthusiastic interest in the Software Engineer I position at THOR Solutions, as advertised on Lensa. Having engineered a real-time video streaming feature using AWS, which reduced load times by 40% and supported over 10,000 concurrent users, I am confident my skills and passion for developing high-performance software align perfectly with the requirements of this role and THOR’s commitment to delivering innovative solutions. My experience as a Software Developer Intern at Delet and GRIP has equipped me with a robust foundation in software development, utilizing languages such as Java, Python, C++, and C#, all of which are listed as key proficiencies for this position. For instance, at Delet, I successfully migrated a legacy website to a React Native application, optimizing API integrations and improving cross-platform compatibility. This directly resulted in a 25% reduction in latency and an 8% increase in user engagement. Furthermore, my projects, such as WalkSafe and JudgifySU, demonstrate my ability to develop full-stack solutions using frameworks like React and Django, and implement complex algorithms for real-world applications, showcasing my capacity to contribute to the Advanced Damage Control Systems (ADCS) & Mine Countermeasure Ship (MCS) Branch. I am eager to apply my skills to the challenges of developing and maintaining system control software for U.S. Navy and Coast Guard vessels. My academic background in Computer Science from Syracuse University, coupled with hands-on experience in software development lifecycle and version control tools like Git, positions me to quickly contribute to your team at Naval Surface Warfare Center Philadelphia Division. I am particularly drawn to THOR’s mission of providing mission-critical support and its dedication to being a Veteran-Friendly Employer. Thank you for considering my application. I am excited about the opportunity to discuss how my skills and enthusiasm can benefit THOR Solutions. Sincerely, Rangel Anselm Koli
    `
    // const model = 'gemini-2.0-flash-thinking-exp-01-21';
    const model = "gemini-2.5-pro-exp-03-25"
    const ai = new GoogleGenAI({vertexai: false, apiKey: import.meta.env.VITE_GOOGLE_API_KEY});
    const response = await ai.models.generateContentStream({
      model: model,
      contents: [{
        text: prompt
        }],
      
    });
    for await (const chunk of response) {
      if (chunk.text) {
        onProgress(chunk.text);
      }
    }
    return response;
  }
    
export const generateAnswerstoQuestions = async (
  resume: string,
  jobDescription: string,
  companyName: string,
  question: string,
  onProgress: (content: string) => void
) =>{

  const prompt = `
You are an AI assistant designed to help job seekers prepare for interviews. You will be provided with a resume, a job description, and a company name. Your task is to answer interview questions in the first person, using the information from these documents to craft your responses. 
     You will be provided with the following information:

Resume: ${resume}
Job Description: ${jobDescription}
Company Name: ${companyName}
Question: ${question}
Instructions:

1. Analyze the resume, job description, and research the company's values and mission.
2. Answer interview questions using a first-person perspective ("I," "me," "my").
3. Tailor your responses to align your skills and experiences (from the resume) with the requirements and responsibilities outlined in the job description.
4. When answering questions about company interest, demonstrate genuine enthusiasm by referencing specific aspects of the company's values, mission, or work that resonate with you.
5. If you encounter a question about salary expectations, provide a range based on industry standards and your experience level (as reflected in the resume).
6. If you are unsure about any details, do not fabricate information. Instead, acknowledge the gap and express your willingness to learn more. For example, "While I haven't directly worked with [specific technology] before, I'm a quick learner and excited to expand my skillset in this area."
7. Maintain a professional and positive tone throughout your responses.
8. Use proper grammar and spelling.
9. Ensure the letter flows logically from one section to the next.
10. No more than 100 words.
12. Avoid generic statements that could apply to any job.
13. Don't explicitly label sections ("Introduction," "Body," etc.).


`

    const model = "gemini-2.5-pro-exp-03-25"
    const ai = new GoogleGenAI({vertexai: false, apiKey: import.meta.env.VITE_GOOGLE_API_KEY});
    const response = await ai.models.generateContentStream({
      model: model,
      contents: [{
        text: prompt
        }],
      
    });
    for await (const chunk of response) {
      if (chunk.text) {
        onProgress(chunk.text);
      }
    }
    return response;
  
  
}