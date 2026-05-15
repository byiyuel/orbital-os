"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const PROMPT = "\x1b[1;32mORBITAL_OS> \x1b[0m";

export default function Terminal() {
  const [isOpen, setIsOpen] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const router = useRouter();
  const inputBuffer = useRef("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "`" || e.key === "dead")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && terminalRef.current && !xtermRef.current) {
      const term = new XTerm({
        cursorBlink: true,
        theme: {
          background: "#02040a",
          foreground: "#00ff88",
          cursor: "#00ff88",
          selectionBackground: "rgba(0, 255, 136, 0.3)",
        },
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 14,
        letterSpacing: 1,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      term.writeln("\x1b[1;32mORBITAL_OS TERMINAL INTERFACE [Version 2.5.0]\x1b[0m");
      term.writeln("Type 'help' for available commands.");
      term.write("\r\n" + PROMPT);

      term.onData((data) => {
        const char = data;
        if (char === "\r") {
          // Enter
          const cmd = inputBuffer.current.trim();
          term.write("\r\n");
          handleCommand(cmd, term);
          inputBuffer.current = "";
        } else if (char === "\u007f") {
          // Backspace
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.write("\b \b");
          }
        } else if (char >= " " && char <= "~") {
          inputBuffer.current += char;
          term.write(char);
        }
      });

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
    }

    if (isOpen && xtermRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
      xtermRef.current.focus();
    }

    return () => {
      // We don't necessarily want to destroy it every time it closes if we want to keep history
      // but for simplicity and current requirements, we'll keep it simple.
    };
  }, [isOpen]);

  const handleCommand = async (command: string, term: XTerm) => {
    const args = command.toLowerCase().split(" ");
    const cmd = args[0];

    switch (cmd) {
      case "help":
        term.writeln("AVAILABLE_COMMANDS:");
        term.writeln("  scan [CODE]        - Navigate to country dashboard (e.g. scan TUR)");
        term.writeln("  compare [C1] [C2]  - Compare two countries (e.g. compare USA CHN)");
        term.writeln("  top gdp            - Show top 10 countries by GDP");
        term.writeln("  top inflation      - Show top 10 countries by inflation");
        term.writeln("  clear              - Clear terminal display");
        term.writeln("  exit               - Close terminal");
        break;

      case "clear":
        term.clear();
        break;

      case "exit":
        setIsOpen(false);
        break;

      case "scan":
        if (args[1]) {
          term.writeln(`INITIATING_SCAN: ${args[1].toUpperCase()}`);
          router.push(`/country/${args[1].toLowerCase()}`);
          setTimeout(() => setIsOpen(false), 500);
        } else {
          term.writeln("\x1b[31mERROR: COUNTRY_CODE REQUIRED\x1b[0m");
        }
        break;

      case "compare":
        if (args[1] && args[2]) {
          term.writeln(`BENCHMARKING: ${args[1].toUpperCase()} vs ${args[2].toUpperCase()}`);
          router.push(`/country/${args[1].toLowerCase()}?compare=${args[2].toLowerCase()}`);
          setTimeout(() => setIsOpen(false), 500);
        } else {
          term.writeln("\x1b[31mERROR: TWO_COUNTRY_CODES REQUIRED\x1b[0m");
        }
        break;

      case "top":
        if (args[1] === "gdp") {
          term.writeln("TOP_10_ECONOMIES (GDP_USD):");
          term.writeln("1. USA  2. CHN  3. DEU  4. JPN  5. IND");
          term.writeln("6. GBR  7. FRA  8. ITA  9. BRA  10. CAN");
        } else if (args[1] === "inflation") {
          term.writeln("TOP_INDICATOR_NODES (INFLATION_CPI):");
          term.writeln("FETCHING_LIVE_DATA...");
          term.writeln("1. ARG  2. TUR  3. VEN  4. EGY  5. NGA");
        } else {
          term.writeln("\x1b[31mERROR: PARAMETER REQUIRED (gdp|inflation)\x1b[0m");
        }
        break;

      case "":
        break;

      default:
        term.writeln(`\x1b[31mCOMMAND_NOT_FOUND: ${cmd}\x1b[0m`);
    }

    term.write(PROMPT);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 pointer-events-none"
        >
          <div className="w-full max-w-4xl h-[60vh] glass-panel rounded-xl overflow-hidden flex flex-col pointer-events-auto border-t-2 border-t-[#00ff88] shadow-[0_0_50px_rgba(0,255,136,0.1)]">
            <div className="bg-[#00ff88]/10 px-4 py-2 flex justify-between items-center border-b border-[#00ff88]/20">
              <div className="text-[10px] font-black tracking-[0.2em] text-[#00ff88]">
                &gt; ORBITAL_OS_COMMAND_SHELL_v2.5
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#00ff88] hover:bg-[#00ff88]/20 rounded p-1 transition-colors">
                <X size={14} />
              </button>
            </div>
            <div ref={terminalRef} className="flex-grow p-4 bg-[#02040a]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
