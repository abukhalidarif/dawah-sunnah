import React from 'react';

export function QuickAccessIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'salah':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M31 11C28.8 11 27 12.8 27 15C27 17.2 28.8 19 31 19C29.3 19.6 27.4 18.8 26.6 17.1C25.8 15.4 26.5 13.3 28.2 12.3C29.1 11.8 30.1 11.3 31 11Z" fill="#E3B34C" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.5" />
          <path d="M10 34H32L35 28L26 24L20 28L13 34Z" fill="#F5ECDB" stroke="#2D2216" className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]" strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="15" cy="24" r="3" fill="#F5ECDB" stroke="#2D2216" className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]" strokeWidth="1.8" />
          <path d="M8 38H38" stroke="#AD823E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'roza':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M27 10C19.8 10 14 15.8 14 23C14 30.2 19.8 36 27 36C31.2 36 34.9 34 37.3 30.9C32.4 31.8 27.6 28.4 26.8 23.4C26 18.4 29.4 13.6 34.4 12.8C32.2 11 29.7 10 27 10Z" fill="#F4C752" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M29 18V27" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="26" y="21" width="6" height="8" rx="1.5" fill="#FFFDF8" stroke="#2D2216" className="dark:fill-[#1C1711] dark:stroke-[#F4ECE0]" strokeWidth="1.6" />
        </svg>
      );
    case 'hajj':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M12 16L24 11L36 16V33L24 38L12 33V16Z" fill="#2D2216" stroke="#2D2216" className="dark:fill-[#1C1711] dark:stroke-[#D4A75E]" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M12 20L24 25L36 20" stroke="#E3B34C" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 25V38" stroke="#6E5D4B" strokeWidth="1.4" />
          <rect x="27" y="26" width="4" height="7" fill="#E3B34C" rx="0.5" />
        </svg>
      );
    case 'zakat':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M19 14H29L27 18H21L19 14Z" fill="#E3B34C" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M21 18C16 21 15 27 17 31H31C33 27 32 21 27 18H21Z" fill="#F4C752" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M11 33H32C34 33 35 35 33 36.5L26 38H11V33Z" fill="#F5ECDB" stroke="#2D2216" className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]" strokeWidth="1.8" strokeLinejoin="round" />
          <text x="24" y="27.5" textAnchor="middle" fill="#2D2216" fontSize="9" fontWeight="700">৳</text>
        </svg>
      );
    case 'taharat':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M15 12H33L30.5 36H17.5L15 12Z" fill="#DCF2E9" stroke="#2D2216" className="dark:fill-[#1A352C] dark:stroke-[#F4ECE0]" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M16.5 21C20 19.5 24 22.5 31.5 21" stroke="#3B8C75" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 25C24 25 21 28.5 21 30.5C21 32.2 22.3 33.5 24 33.5C25.7 33.5 27 32.2 27 30.5C27 28.5 24 25 24 25Z" fill="#52B79A" />
        </svg>
      );
    case 'marriage':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <circle cx="20" cy="27" r="7.5" stroke="#E3B34C" strokeWidth="3.2" />
          <circle cx="20" cy="27" r="7.5" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.2" />
          <circle cx="28.5" cy="27" r="7.5" stroke="#D49A3A" strokeWidth="3.2" />
          <circle cx="28.5" cy="27" r="7.5" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="1.2" />
          <path d="M24 14C24 12.2 26.4 11.5 27.3 13C28.2 11.5 30.6 12.2 30.6 14C30.6 16 27.3 18 27.3 18C27.3 18 24 16 24 14Z" fill="#D96B6B" />
        </svg>
      );
    case 'talaq':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M24 11V37M15 37H33" stroke="#2D2216" className="dark:stroke-[#F4ECE0]" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 17H35" stroke="#AD823E" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M13 17L10 26H16L13 17Z" fill="#F5ECDB" stroke="#2D2216" className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M35 17L32 26H38L35 17Z" fill="#F5ECDB" stroke="#2D2216" className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case 'dua':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path
            d="M24 9L25.4 12.6L29 14L25.4 15.4L24 19L22.6 15.4L19 14L22.6 12.6L24 9Z"
            fill="#E3B34C"
            stroke="#2D2216"
            className="dark:stroke-[#F4ECE0]"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M9 27L12.5 21C13.6 19.3 15.8 19.6 16.5 21.5L19 28.5L23.5 31.5V37H14.5C11.5 37 9 34.4 9 31.2V27Z"
            fill="#F5ECDB"
            stroke="#2D2216"
            className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M39 27L35.5 21C34.4 19.3 32.2 19.6 31.5 21.5L29 28.5L24.5 31.5V37H33.5C36.5 37 39 34.4 39 31.2V27Z"
            fill="#F5ECDB"
            stroke="#2D2216"
            className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12.5 26L15 30.5M35.5 26L33 30.5"
            stroke="#AD823E"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M18 39H30"
            stroke="#AD823E"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'qurbani':
    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className="w-11 h-11">
          <path d="M16 22C16 17.5 19.5 14 24 14C28.5 14 32 17.5 32 22V31C32 33.2 30.2 35 28 35H20C17.8 35 16 33.2 16 31V22Z" fill="#F5ECDB" stroke="#2D2216" className="dark:fill-[#2B2114] dark:stroke-[#F4ECE0]" strokeWidth="1.8" />
          <path d="M16 18C12.5 17 11 19 12.5 21.5M32 18C35.5 17 37 19 35.5 21.5" stroke="#AD823E" strokeWidth="2" strokeLinecap="round" />
          <circle cx="21" cy="24" r="1.3" fill="#2D2216" className="dark:fill-[#F4ECE0]" />
          <circle cx="27" cy="24" r="1.3" fill="#2D2216" className="dark:fill-[#F4ECE0]" />
          <path d="M22.5 29H25.5" stroke="#AD823E" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}
