import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserProfile } from "@/lib/userService";
import { UserProfile } from "@/lib/supabaseTypes";
import SubscriptionDisplay from "@/components/SubscriptionDisplay";
import Header from "@/components/Header";
import { useTheme } from "@/components/theme-provider";

const Credits = () => {
  const { theme } = useTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [coverLetters, setCoverLetters] = useState<string[]>([]);
  useEffect(() => {
    const fetchUser = async () => {
      const profile = await getUserProfile();
      console.log("UserCredits", profile);
      setUser(profile);
    };

    const fetchCoverLetters = async () => {
      const { data, error } = await supabase
        .from("cover_letters")
        .select("*")
        .eq("user_id", user?.id);

      if (!error && data) {
        setCoverLetters(data.map((item) => item.title));
      }
    };

    fetchUser();
    if (user) fetchCoverLetters();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div
      className={`min-h-screen ${
        theme ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <Header handleSignOut={handleSignOut} user={user} />
      <div className='max-w-4xl mx-auto'>
        {user?.id && <SubscriptionDisplay userId={user.id} />}
        <div className='mt-8'>
          <h2 className='text-xl font-bold'>Your Cover Letters</h2>
          <ul className='list-disc pl-5 mt-4'>
            {coverLetters.length > 0 ? (
              coverLetters.map((title, index) => (
                <li key={index} className='mb-2'>
                  {title}
                </li>
              ))
            ) : (
              <p>No cover letters found.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Credits;
