import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { generateCoverLetter } from "@/lib/vertexAI";
import {
  getUserCredits,
  useCredit,
  hasActiveSubscription,
} from "@/lib/userService";
import { BlockNoteSchema } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from "@blocknote/xl-pdf-exporter";
import PDFPreview from "../components/PDFPreview";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useTheme } from "@/components/theme-provider";
const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPDFDocument] = useState<any>();
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [coverLetterId, setCoverLetterId] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const { theme } = useTheme();
  const coverLetterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user credits
        const credits = await getUserCredits();
        setUserCredits(credits);
      }
    };

    getUser();

    // Load resume from localStorage if available
    const savedResume = localStorage.getItem("resume");
    if (savedResume) {
      setResume(savedResume);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const subscriptionStatus = await hasActiveSubscription();
      setIsSubscribed(subscriptionStatus);
      console.log("Subscription status:", subscriptionStatus);
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Function to save or update cover letter in the database
  const saveCoverLetterDb = async () => {
    if (!user) return;
    if (!coverLetterId && !coverLetter) return;
    const payload = {
      user_id: user.id,
      company_name: companyName,
      resume: resume,
      job_description: jobDescription,
      cover_letter: editor.document,
      updated_at: new Date().toISOString(),
    };
    // Use upsert so that new records are inserted and existing records updated
    const { data, error } = await supabase
      .from("cover_letters")
      .upsert(payload)
      .select();
    if (error) {
      console.error("Error saving cover letter:", error);
    } else if (!coverLetterId && data && data.length > 0) {
      // Save the returned id on first insert
      setCoverLetterId(data[0].id);
      console.log("Cover letter saved with ID:", data[0].id);
    }
  };

  // Debounce updating the cover letter to avoid spamming DB calls on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveCoverLetterDb();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [coverLetter, companyName, resume, jobDescription]);

  const handleGenerateCoverLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubscribed) {
      // If the user has a subscription, bypass all other logic and generate the cover letter
      setError(null);
      setIsGenerating(true);
      setCoverLetter("");
      try {
        const blockIds = editor.document.map((block) => block.id);
        if (blockIds.length > 0) {
          editor.removeBlocks(blockIds);
        }
        onChange();
        editor.insertBlocks(
          [
            {
              type: "heading",
              content: "Cover Letter",
              props: {
                level: 2,
                textAlignment: "center",
              },
            },
          ],
          editor.document[editor.document.length - 1],
          "after"
        );
        let buffer = "";
        await generateCoverLetter(
          resume,
          jobDescription,
          companyName,
          (content) => {
            setCoverLetter((prev) => prev + content);
            buffer += content;
            if (buffer.includes("\n")) {
              const lines = buffer.split("\n");
              for (let i = 0; i < lines.length - 1; i++) {
                if (lines[i].trim()) {
                  editor.insertBlocks(
                    [
                      {
                        type: "paragraph",
                        content: lines[i],
                        props: {
                          textAlignment: "justify",
                        },
                      },
                    ],
                    editor.document[editor.document.length - 1],
                    "after"
                  );
                }
              }
              buffer = lines[lines.length - 1];
              onChange();
            }
          }
        );
        if (buffer.trim()) {
          editor.insertBlocks(
            [
              {
                type: "paragraph",
                content: buffer,
                props: {
                  textAlignment: "justify",
                },
              },
            ],
            editor.document[editor.document.length - 1],
            "after"
          );
          onChange();
        }
        if (coverLetter) {
          saveCoverLetterDb();
        }
      } catch (error: any) {
        setError("Failed to generate cover letter: " + error.message);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (!resume || !jobDescription || !companyName) {
      setError("Please fill in all fields");
      return;
    }
    if (!isSubscribed && userCredits < 1) {
      setError(
        "You don't have enough credits. Please purchase more credits to continue."
      );
      return;
    }
    setError(null);
    setIsGenerating(true);
    setCoverLetter("");
    try {
      // Clear the editor content before generating new cover letter
      const blockIds = editor.document.map((block) => block.id);
      if (blockIds.length > 0) {
        editor.removeBlocks(blockIds);
      }
      // Update the PDF view after clearing
      onChange();
      // Use a credit before generating if not subscribed
      if (!isSubscribed) {
        const creditUsed = await useCredit("Cover letter generation");
        if (!creditUsed) {
          throw new Error("Failed to use credit");
        }
        // Update local credit count
        setUserCredits((prev) => prev - 1);
      }
      editor.insertBlocks(
        [
          {
            type: "heading",
            content: "Cover Letter",
            props: {
              level: 2,
              textAlignment: "center",
            },
          },
        ],
        editor.document[editor.document.length - 1],
        "after"
      );
      let buffer = "";
      await generateCoverLetter(
        resume,
        jobDescription,
        companyName,
        (content) => {
          // Append each streamed piece of text to the coverLetter state
          setCoverLetter((prev) => prev + content);
          // Add content to our buffer
          buffer += content;
          // Process buffer only if it contains newline characters
          if (buffer.includes("\n")) {
            const lines = buffer.split("\n");
            // Process all complete lines except the last one
            for (let i = 0; i < lines.length - 1; i++) {
              if (lines[i].trim()) {
                editor.insertBlocks(
                  [
                    {
                      type: "paragraph",
                      content: lines[i],
                      props: {
                        textAlignment: "justify",
                      },
                    },
                  ],
                  editor.document[editor.document.length - 1],
                  "after"
                );
              }
            }
            // Keep the incomplete part in the buffer
            buffer = lines[lines.length - 1];
            // Trigger PDF update
            onChange();
          }
        }
      );
      // Handle any remaining text in buffer after stream completes
      if (buffer.trim()) {
        editor.insertBlocks(
          [
            {
              type: "paragraph",
              content: buffer,
              props: {
                textAlignment: "justify",
              },
            },
          ],
          editor.document[editor.document.length - 1],
          "after"
        );
        onChange();
      }
      // Save the newly generated cover letter to the database
      if (coverLetter) {
        saveCoverLetterDb();
      }
    } catch (error: any) {
      setError("Failed to generate cover letter: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create(),

    initialContent: [
      {
        type: "paragraph",
        content: "This is a sample paragraph in the BlockNote editor.",
        props: {
          textAlignment: "justify",
        },
      },
    ],
  });
  const onChange = async () => {
    const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);
    // Converts the editor's contents from Block objects to HTML and store to state.
    const pdfDocument = await exporter.toReactPDFDocument(editor.document);
    setPDFDocument(pdfDocument);

    // const blob = await ReactPDF.pdf(pdfDocument).toBlob();
  };

  useEffect(() => {
    onChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className='min-h-screen p-4 bg-background'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0 }}
    >
      <div className='mx-auto'>
        <Header handleSignOut={handleSignOut} user={user} />
        <div className='md:mx-20 grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Input Form Card */}
          <motion.div
            className='p-6 rounded-xl shadow-lg transition-colors duration-200 bg-card'
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { delay: 0.3, duration: 0.5 },
            }}
          >
            <h2 className='text-xl font-semibold mb-4 text-primary'>
              Input Information
            </h2>

            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                {error}
              </div>
            )}

            {userCredits === 0 && !isSubscribed && (
              <div className='bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4'>
                You've used all your credits. Purchase more to continue
                generating cover letters.
              </div>
            )}

            <form onSubmit={handleGenerateCoverLetter} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Company Name
                </label>
                <input
                  type='text'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className='w-full rounded-md shadow-sm p-2 border bg-input text-input-foreground'
                  placeholder='e.g., Google'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Your Resume
                </label>
                <textarea
                  value={resume}
                  onChange={(e) => {
                    const value = e.target.value;
                    setResume(value);
                    localStorage.setItem("resume", value);
                  }}
                  className='w-full rounded-md shadow-sm p-2 border h-36 bg-input text-input-foreground'
                  placeholder='Paste your resume text here...'
                  required
                ></textarea>
              </div>

              <div>
                <label className='block text-sm font-medium mb-1 text-foreground'>
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className='w-full rounded-md shadow-sm p-2 border h-36 bg-input text-input-foreground'
                  placeholder='Paste the job description here...'
                  required
                ></textarea>
              </div>

              <button
                type='submit'
                className={`w-full py-2 px-4 rounded-md focus:outline-none transition-colors duration-200 ${
                  isGenerating
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg
                      className='animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  `Generate Cover Letter (1 Credit)`
                )}
              </button>
            </form>
          </motion.div>

          {/* Cover Letter Output Card */}
          <motion.div
            className='p-6 rounded-xl shadow-lg transition-colors duration-200 bg-card'
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { delay: 0.5, duration: 0.5 },
            }}
          >
            <h2 className='text-xl font-semibold mb-4 text-foreground'>
              Your Cover Letter
            </h2>
            <div
              ref={coverLetterRef}
              className={`p-4 rounded border min-h-[500px] max-h-[500px] overflow-y-auto whitespace-pre-wrap ${
                isGenerating ? "animate-pulse" : ""
              } bg-muted border-border transition-colors duration-200`}
            >
              <BlockNoteView
                editor={editor}
                onChange={onChange}
                theme={theme == "dark" ? "dark" : "light"}
                style={{
                  textAlign: "justify",
                }}
              ></BlockNoteView>
            </div>
            {coverLetter && (
              <div className='mt-4 flex space-x-3'>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter);
                  }}
                  className='px-4 py-2 rounded-md text-sm flex items-center transition-colors duration-200 bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
                    />
                  </svg>
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setIsPDFPreviewOpen(true)}
                  className='bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary-hover transition-colors duration-200 text-sm flex items-center'
                  disabled={!pdfDocument}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 mr-2'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  Preview PDF
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreview
        pdfDocument={pdfDocument}
        isOpen={isPDFPreviewOpen}
        onClose={() => setIsPDFPreviewOpen(false)}
      />
    </motion.div>
  );
};

export default Home;
