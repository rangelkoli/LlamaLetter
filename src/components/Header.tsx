import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserSubscription } from "@/lib/userService";
import { ModeToggle } from "./mode-toggle";
import { useTheme } from "./theme-provider";
interface HeaderProps {
  handleSignOut: () => void;
  user: any;
}

const Header = ({ handleSignOut, user }: HeaderProps) => {
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(false);
  const { theme } = useTheme();

  const fetchUserData = async () => {
    const premiumStatus = await getUserSubscription();
    if (premiumStatus?.status === "active") {
      setIsPremium(true);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <motion.header
      className={`rounded-xl shadow-lg mb-8 flex justify-between items-center p-6 ${
        theme == "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.5 } }}
    >
      <h1
        className='text-3xl font-bold  cursor-pointer hover:scale-105 transition-transform'
        onClick={() => navigate("/")}
      >
        Cover Letter Generator
      </h1>
      <div className='flex items-center gap-6'>
        {user && (
          <div className='flex flex-col items-end'>
            <p className=''>
              <span className='font-semibold'>{user.email}</span>
            </p>
            <div className='flex items-center gap-2'>
              {isPremium ? (
                <span className='text-green-300 font-bold text-lg'>
                  Premium User
                </span>
              ) : (
                <span className='text-gray-300'>Free User</span>
              )}
            </div>
          </div>
        )}
        <ModeToggle />
        <button
          onClick={() => navigate("/profile")}
          className='px-4 py-2 rounded-md text-sm transition-colors duration-200 bg-blue-500 text-white hover:bg-blue-600'
        >
          Profile
        </button>
        <button
          onClick={() => navigate("/credits")}
          className='px-4 py-2 rounded-md text-sm transition-colors duration-200 bg-green-500 text-white hover:bg-green-600'
        >
          Credits
        </button>
        <button
          onClick={handleSignOut}
          className='px-4 py-2 rounded-md text-sm transition-colors duration-200 bg-red-500 text-white hover:bg-red-600'
        >
          Sign Out
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
