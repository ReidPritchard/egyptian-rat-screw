import { VoteState } from '../types';
import { useState } from 'react';

export const useVote = (voteState: VoteState) => {
  const [vote, setVote] = useState<boolean | null>(null);

  const handleVote = (vote: boolean) => {
    setVote(vote);
  };

  return { vote, handleVote };
};
