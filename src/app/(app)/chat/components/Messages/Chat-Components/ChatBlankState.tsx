"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const ChatBlankState = ({ isGlobalAgent }: { isGlobalAgent: boolean }) => {
  return (
    <section className='flex flex-col min-h-[400px]' aria-label='Welcome message'>
      {/* Header at Top Left */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='flex items-center gap-3 mb-8'>
        <div className='w-10 h-10 rounded-full bg-card dark:bg-card border border-border dark:border-border flex items-center justify-center shadow-sm'>
          <MessageCircle className='w-5 h-5 text-primary dark:text-primary' strokeWidth={2} />
        </div>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-lg font-semibold text-foreground dark:text-foreground'>Chat</h2>
          <p className='text-xs text-muted-foreground dark:text-muted-foreground font-normal'>Start Conversation with us</p>
        </div>
      </motion.div>
      
      {/* Centered Empty State Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className='flex flex-col items-center justify-center flex-1 gap-6'>

        {/* Illustration SVG - Simplified geometric shapes */}
        <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
          <g>
            {/* Left message bubble - light blue/gray */}
            <rect x="10" y="15" width="70" height="35" rx="8" fill="currentColor" className="text-muted dark:text-muted" opacity="0.4" />
            <rect x="15" y="22" width="40" height="6" rx="3" fill="#605BFF" opacity="0.6" />
            <rect x="15" y="32" width="50" height="4" rx="2" fill="currentColor" className="text-muted-foreground dark:text-muted-foreground" opacity="0.3" />
            
            {/* Right message bubbles - purple gradient */}
            <rect x="120" y="8" width="68" height="40" rx="12" fill="#695CFF" opacity="0.5" />
            <rect x="110" y="30" width="68" height="40" rx="12" fill="#AE8FF7" opacity="0.6" />
            
            {/* Decorative dots */}
            <circle cx="50" cy="75" r="4" fill="#605BFF" opacity="0.4" />
            <circle cx="150" cy="80" r="4" fill="#695CFF" opacity="0.5" />
            
            {/* Connecting dashed line */}
            <line x1="54" y1="75" x2="146" y2="80" stroke="currentColor" className="text-border dark:text-border" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
          </g>
        </svg>
        
        {/* Message text */}
        <p className='text-sm text-muted-foreground dark:text-muted-foreground font-normal'>Begin a new conversation</p>
      </motion.div>
    </section>
  );
};

export default ChatBlankState;
