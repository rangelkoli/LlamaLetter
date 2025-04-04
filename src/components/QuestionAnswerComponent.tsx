import { useState } from "react";
import { generateAnswerstoQuestions } from "../lib/vertexAI";

const QuestionAnswerComponent = (
  {
    resume,
    jobDescription,
    companyName,
  }: { resume: string; jobDescription: string; companyName: string } // Props to receive resume and job description
) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateAnswer = async () => {
    setLoading(true);
    setAnswer("");

    try {
      await generateAnswerstoQuestions(
        resume,
        jobDescription,
        question,
        companyName,
        (content: string) => {
          setAnswer((prev) => prev + content);
        }
      );
    } catch (error) {
      console.error("Error generating answer:", error);
      setAnswer("An error occurred while generating the answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
      <h1 className='text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100'>
        AI Question Answer
      </h1>

      <div className='mb-4'>
        <label
          htmlFor='question'
          className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
        >
          Question:
        </label>
        <textarea
          id='question'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='Enter your question here'
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]'
        />
      </div>

      <button
        onClick={handleGenerateAnswer}
        disabled={loading}
        className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      >
        {loading ? "Generating..." : "Generate Answer"}
      </button>

      {answer && (
        <div className='mt-6 p-4 bg-gray-50 rounded-md border border-gray-200'>
          <h2 className='text-xl font-semibold mb-2 text-gray-800'>Answer:</h2>
          <p className='whitespace-pre-line text-gray-700'>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionAnswerComponent;
