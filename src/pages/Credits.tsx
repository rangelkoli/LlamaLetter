import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getUserProfile } from "@/lib/userService";
import { UserProfile } from "@/lib/supabaseTypes";
import SubscriptionDisplay from "@/components/SubscriptionDisplay";
import Header from "@/components/Header";

const Credits = () => {
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
    <div className='min-h-screen bg-background'>
      <Header handleSignOut={handleSignOut} user={user} />
      <div className='max-w-4xl mx-auto px-4'>
        {user?.id && <SubscriptionDisplay userId={user.id} />}
        <div className='mt-8 p-6 rounded-xl shadow-md bg-card'>
          <h2 className='text-xl font-bold text-foreground'>
            Your Cover Letters
          </h2>
          <ul className='list-disc pl-5 mt-4 text-foreground'>
            {coverLetters.length > 0 ? (
              coverLetters.map((title, index) => (
                <li key={index} className='mb-2'>
                  {title}
                </li>
              ))
            ) : (
              <p className='text-muted-foreground'>No cover letters found.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Credits;
