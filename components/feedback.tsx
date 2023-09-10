import React, { useState, useRef, useEffect } from 'react';

interface FeedbackModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
    onCancel: () => void;
    //votetype can be 'upvote' or 'downvote', and should never be null
    feedbackVote: string;
  }
  
export default function Feedback({ show, onClose, onSubmit, onCancel, feedbackVote }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState<string>("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (show && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [show]);

    const handleFeedbackSubmit = () => {
      onSubmit(feedback);
      setFeedback("");
      onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleFeedbackSubmit();
        }
    };
    
    const handleCancelWrapper = () => {
        setFeedback("");
        onCancel();
    }
  
    return (
        show ? (
          <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
              <div className="relative w-auto my-6 mx-auto max-w-3xl">
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                    <h3 className="text-3xl font-semibold">Translation Feedback: {feedbackVote}</h3>
                    <button className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                            onClick={handleCancelWrapper}>
                      <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">×</span>
                    </button>
                  </div>
                  <div className="relative p-6 flex-auto">
                    <textarea 
                    ref={textareaRef}
                    className="w-full" 
                    onChange={(e) => setFeedback(e.target.value)} 
                    value={feedback}></textarea>
                  </div>
                  <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                    <button className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            onClick={handleCancelWrapper}>
                      Cancel
                    </button>
                    <button className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                            onClick={handleFeedbackSubmit}>
                      Submit Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>
        ) : null
      );
  };