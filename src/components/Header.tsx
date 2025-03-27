import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserSubscription, getUserCredits } from "@/lib/userService";
import { ModeToggle } from "./mode-toggle";

interface HeaderProps {
  handleSignOut: () => void;
  user: any;
}

const Header = ({ handleSignOut, user }: HeaderProps) => {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const [freeGenerations, setFreeGenerations] = useState<number | null>(null);

  const fetchUserData = async () => {
    // Check subscription status
    const premiumStatus = await getUserSubscription();
    if (premiumStatus?.status === "active") {
      setIsPremium(true);
    } else {
      // If not premium, fetch free generations count
      const credits = await getUserCredits();
      if (typeof credits === "number") {
        setFreeGenerations(credits);
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  return (
    <motion.header
      className='rounded-xl shadow-lg mb-8 flex justify-between items-center p-6 bg-card text-card-foreground'
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.5 } }}
    >
      <h1
        className='text-3xl font-bold cursor-pointer hover:scale-105 transition-transform'
        onClick={() => navigate("/")}
      >
        Cover Letter Generator
      </h1>

      <div className='flex items-center gap-6'>
        {user && (
          <div className='flex flex-col items-end'>
            <p className='text-foreground'>
              <span className='font-semibold'>{user.email}</span>
            </p>
            <div className='flex items-center gap-2'>
              {isPremium ? (
                <span className='text-green-600 dark:text-green-400 font-bold text-lg'>
                  Premium User
                </span>
              ) : (
                <div className='flex flex-col items-end'>
                  <span className='text-gray-500 dark:text-gray-400'>
                    Free User
                  </span>
                  {freeGenerations !== null && (
                    <span
                      className={`text-xs ${
                        freeGenerations > 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {freeGenerations > 0
                        ? `${freeGenerations} ${
                            freeGenerations === 1 ? "generation" : "generations"
                          } left`
                        : "No generations left"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <ModeToggle />
        <button
          onClick={() => navigate("/profile")}
          className='px-4 py-2 rounded-md text-sm transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700'
        >
          Profile
        </button>
        <button
          onClick={() => navigate("/credits")}
          className='px-4 py-2 rounded-md text-sm transition-colors duration-200 bg-green-600 text-white hover:bg-green-700'
        >
          Credits
        </button>
        <button
          onClick={handleSignOut}
          className='px-4 py-2 rounded-md text-sm transition-colors duration-200 bg-red-600 text-white hover:bg-red-700'
        >
          Sign Out
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
