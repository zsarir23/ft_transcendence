/* eslint-disable @next/next/no-img-element */
'use client';

import { LuSearch } from 'react-icons/lu';
import { CiSearch } from 'react-icons/ci';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import getAllUsers from '@/services/getAllUsers';
import { User } from '@/components/messages/data';

const SearchInput = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [searchResultsUsers, setSearchResultsUsers] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    getAllUsers().then((data: User[]) => {
      if (data) {
        setAllUsers(data);
      }
    });
  }, []);

  const onSearch = () => {
    setInput(''); // clear input
    const encodedQuery = encodeURIComponent(searchQuery);
    router.push(`/search?query=${encodedQuery}`);
    console.log('searching for', searchQuery);
  };

  const searchUsers = (query: string) => {
    setSearchResultsUsers(
      allUsers.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  };

  return (
    <div className="bg-[#424283] border-[0.09rem] border-white/50 rounded-xl relative lg:w-[400px] w-[250px] py-[0.1rem z-10 px-2">
      <input
        type="text"
        value={input}
        className="w-full py-[0.4rem] px-2 bg-transparent outline-none  text-sm text-white/80  font-light placeholder:font-extralight placeholder:italic placeholder:opacity-80 "
        placeholder="search something..."
        onChange={(event) => {
          setInput(event.target.value);
          searchUsers(event.target.value);
        }}
        onClick={() => {
          setShowSearchResults((prev) => !prev);
        }}
      />
      <div className="absolute top-0 bottom-0 right-2">
        <CiSearch
          style={{
            color: 'white',
            opacity: 0.6,
            width: '1.8rem',
            height: '1.8rem',
          }}
        />
      </div>
      {showSearchResults && (
        <div
          className="w-full max-h-80 min-h-12 absolute  transform 
      left-1/2 -translate-x-1/2 mt-2 shadow-lg bg-white/20 rounded-xl border border-white/20 flex flex-col overflow-y-auto p-2 z-10 "
        >
          {searchResultsUsers.map((user) => (
            <div
              key={user.id}
              className="px-2 py-1 w-full text-white/80 hover:bg-white/20 hover:text-white"
              onClick={() => {
                router.push(`/profile/${user.username}`);
              }}
            >
              <img
                src={process.env.BACKEND + `/api/users/${user.id}/avatar`}
                alt="avatar"
                className="w-8 h-8 rounded-full inline-block mr-2"
              />
              <p>{user.username}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
