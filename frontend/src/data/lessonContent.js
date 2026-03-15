/**
 * Returns rich lesson content based on lesson title, type, and language.
 * Realistic enough to feel like a real course platform.
 */
export function getLessonContent(lesson, courseName, lang) {
  const title = lesson.title;
  const type  = lesson.type;

  // ─── Real content map keyed by lesson title ───────────────────────────────
  const CONTENT_MAP = {
    // C ───────────────────────────────────────────────────────────────────────
    "What is C and Why Learn It?": {
      intro: `C is a **general-purpose, procedural programming language** developed by Dennis Ritchie at Bell Labs in 1972. It was designed to write the UNIX operating system and quickly became one of the most widely used languages in history.`,
      sections: [
        {
          heading: "Why C is Still Relevant",
          body: `Despite being over 50 years old, C remains the backbone of modern computing:\n- **Operating Systems**: Linux, Windows, macOS kernels are written in C\n- **Embedded Systems**: Microcontrollers and IoT devices use C due to direct hardware control\n- **Compilers**: Most language compilers (Python, Ruby, PHP) are themselves written in C\n- **Game Engines**: Performance-critical parts of engines like Unreal use C\n- **Databases**: SQLite, MySQL core are C-based`
        },
        {
          heading: "C in the Language Family",
          body: `C influenced virtually every major language that followed:\n\`\`\`\nC (1972) → C++ (1983) → Java (1995) → C# (2000)\n                       → Objective-C → Swift\n                       → JavaScript (syntax influenced)\n\`\`\``
        },
        {
          heading: "Key Characteristics",
          body: `• **Compiled language** – Code is compiled directly to machine code for maximum speed\n• **Statically typed** – Variable types are fixed at compile time\n• **Manual memory management** – You control allocation and deallocation\n• **Portable** – Write once, compile anywhere with a C compiler\n• **Low-level access** – Can directly manipulate memory via pointers`
        },
        {
          heading: "Where C Is Used Today",
          body: `| Domain | Examples |\n|---|---|\n| OS Kernels | Linux, FreeBSD |\n| Embedded | Arduino, automotive ECUs |\n| Databases | SQLite, PostgreSQL core |\n| Networking | OpenSSL, nginx |\n| Compilers | GCC, Clang |`
        }
      ],
      takeaway: "C gives you unparalleled control over hardware and memory, making it the foundation every serious programmer should understand."
    },

    "Installing GCC & VS Code": {
      intro: `Before writing C code, you need two things: a **compiler** to convert your code to machine instructions, and a **code editor** to write comfortably.`,
      sections: [
        {
          heading: "Installing GCC on macOS",
          body: `GCC comes with Xcode Command Line Tools:\n\`\`\`bash\nxcode-select --install\n# Verify installation\ngcc --version\n\`\`\``
        },
        {
          heading: "Installing GCC on Windows",
          body: `Download and install **MinGW-w64** from winlibs.com:\n1. Download the latest GCC build\n2. Extract to \`C:\\mingw64\`\n3. Add \`C:\\mingw64\\bin\` to your PATH\n4. Open a new terminal and verify:\n\`\`\`bash\ngcc --version\n# gcc (x86_64-posix-seh-rev0) 13.2.0\n\`\`\``
        },
        {
          heading: "Installing VS Code",
          body: `1. Download from [code.visualstudio.com](https://code.visualstudio.com)\n2. Install the **C/C++ Extension** by Microsoft (from the Extensions panel)\n3. Install **Code Runner** extension for quick compilation\n\nYour \`settings.json\` additions:\n\`\`\`json\n{\n  "code-runner.runInTerminal": true,\n  "code-runner.executorMap": {\n    "c": "cd $dir && gcc $fileName -o $fileNameWithoutExt && ./$fileNameWithoutExt"\n  }\n}\n\`\`\``
        },
        {
          heading: "Compiling Your First File",
          body: `Create \`hello.c\` and compile:\n\`\`\`bash\n# Compile\ngcc hello.c -o hello\n\n# Run\n./hello          # macOS/Linux\nhello.exe        # Windows\n\`\`\`\n\nUseful GCC flags:\n| Flag | Purpose |\n|---|---|\n| \`-o name\` | Set output filename |\n| \`-Wall\` | Enable all warnings |\n| \`-g\` | Include debug info |\n| \`-O2\` | Optimize for speed |`
        }
      ],
      takeaway: "You now have a fully configured C development environment. In the next lesson you'll write your first program!"
    },

    "Hello World – Your First Program": {
      intro: `The classic first program every programmer writes. It's simple but teaches you the fundamental structure every C program must follow.`,
      sections: [
        {
          heading: "The Program",
          body: `\`\`\`c\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n\`\`\``
        },
        {
          heading: "Breaking It Down",
          body: `**Line 1: \`#include <stdio.h>\`**\nThis is a **preprocessor directive**. It tells the compiler to include the Standard Input/Output library. \`printf\` lives in this library.\n\n**Line 3: \`int main()\`**\nEvery C program must have exactly one \`main\` function. Execution always starts here. \`int\` means the function returns an integer to the OS.\n\n**Line 4: \`printf("Hello, World!\\n");\`**\n- \`printf\` prints formatted text to the terminal\n- \`\\n\` is the newline escape character\n- The semicolon \`;\` ends every statement in C\n\n**Line 5: \`return 0;\`**\nReturns 0 to the operating system, signalling success. Any non-zero value indicates an error.`
        },
        {
          heading: "Exercise: Modify It",
          body: `Try these extensions:\n\`\`\`c\n// Print your name\nprintf("My name is Sathyam\\n");\n\n// Print multiple lines\nprintf("Line 1\\nLine 2\\nLine 3\\n");\n\n// Print with a tab\nprintf("\\tIndented text\\n");\n\`\`\``
        },
        {
          heading: "Common Escape Sequences",
          body: `| Sequence | Meaning |\n|---|---|\n| \`\\n\` | New line |\n| \`\\t\` | Tab |\n| \`\\\\\` | Backslash |\n| \`\\"\` | Double quote |\n| \`\\0\` | Null character |`
        }
      ],
      takeaway: "You've written and understood your first C program. The structure — include, main, statements, return — is the same in every C program you'll ever write."
    },

    "Variables and Data Types": {
      intro: `In C, every variable must have a **type** declared before use. The type tells the compiler how much memory to allocate and how to interpret the bits stored there.`,
      sections: [
        {
          heading: "Fundamental Data Types",
          body: `\`\`\`c\nint    age    = 21;          // 4 bytes, -2B to 2B\nfloat  gpa    = 9.2f;        // 4 bytes, ~7 decimal digits\ndouble pi     = 3.14159265;  // 8 bytes, ~15 decimal digits\nchar   grade  = 'A';         // 1 byte, single character\n\`\`\`\n\n| Type | Size | Range |\n|---|---|---|\n| \`char\` | 1 byte | -128 to 127 |\n| \`int\` | 4 bytes | -2,147,483,648 to 2,147,483,647 |\n| \`float\` | 4 bytes | ±3.4×10³⁸ |\n| \`double\` | 8 bytes | ±1.7×10³⁰⁸ |`
        },
        {
          heading: "Type Modifiers",
          body: `\`\`\`c\nunsigned int  count = 4294967295U; // 0 to 4B\nlong int      big   = 9999999999L;\nshort int     small = 32767;\nlong double   huge  = 3.14159L;\n\`\`\``
        },
        {
          heading: "Declaring vs Initialising",
          body: `\`\`\`c\nint x;        // declared only — contains garbage value!\nint y = 10;   // declared and initialised\n\nprintf("%d\\n", x);  // DANGEROUS – undefined behaviour\nprintf("%d\\n", y);  // Safe – prints 10\n\`\`\`\n\n⚠️ Always initialise variables before use!`
        },
        {
          heading: "Format Specifiers for printf",
          body: `\`\`\`c\nint    n = 42;     printf("%d\\n", n);\nfloat  f = 3.14f;  printf("%f\\n", f);   // 3.140000\ndouble d = 3.14;   printf("%.2lf\\n", d); // 3.14\nchar   c = 'Z';    printf("%c\\n", c);\nchar*  s = "hi";   printf("%s\\n", s);\n\`\`\``
        }
      ],
      takeaway: "Choosing the right data type prevents memory waste and overflow bugs. Always initialise your variables!"
    },

    "Pointers – Basics and Address-of Operator": {
      intro: `Pointers are one of C's most powerful (and feared) features. A pointer is simply a **variable that stores a memory address** rather than a value directly.`,
      sections: [
        {
          heading: "Memory Addresses",
          body: `Every variable lives at a unique address in RAM. The **\`&\` operator** gives you that address:\n\`\`\`c\nint x = 42;\nprintf("Value:   %d\\n", x);   // 42\nprintf("Address: %p\\n", &x);  // 0x7ffee3b2c5ac\n\`\`\``
        },
        {
          heading: "Declaring a Pointer",
          body: `\`\`\`c\nint  x   = 42;\nint *ptr = &x;   // ptr holds the address of x\n\nprintf("%p\\n", ptr);   // address of x\nprintf("%d\\n", *ptr);  // 42  — dereference to get value\n\n*ptr = 100;  // modify x through the pointer\nprintf("%d\\n", x);  // 100\n\`\`\``
        },
        {
          heading: "Pointer Arithmetic",
          body: `\`\`\`c\nint arr[] = {10, 20, 30, 40};\nint *p = arr;   // points to arr[0]\n\nprintf("%d\\n", *p);      // 10\nprintf("%d\\n", *(p+1));  // 20\nprintf("%d\\n", *(p+2));  // 30\n\`\`\`\nWhen you add 1 to an \`int*\`, the address moves forward by **4 bytes** (sizeof int).`
        },
        {
          heading: "NULL Pointer",
          body: `\`\`\`c\nint *p = NULL;   // safe "no address" value\n\nif (p == NULL) {\n    printf("Pointer not yet assigned!\\n");\n}\n\`\`\`\n⚠️ Dereferencing a NULL pointer causes a **segmentation fault**. Always check before dereferencing.`
        }
      ],
      takeaway: "Pointers give you direct memory access — the foundation of dynamic memory, data structures, and system programming in C."
    },

    // Python ──────────────────────────────────────────────────────────────────
    "Why Python?": {
      intro: `Python is a **high-level, interpreted, general-purpose programming language** created by Guido van Rossum and released in 1991. Its design philosophy emphasises code readability with significant indentation.`,
      sections: [
        {
          heading: "Python's Superpower: Readability",
          body: `Compare summing a list:\n**Java:**\n\`\`\`java\nint sum = 0;\nfor (int x : numbers) { sum += x; }\n\`\`\`\n**Python:**\n\`\`\`python\nsum(numbers)\n\`\`\`\nPython lets you express ideas in fewer lines, reducing bugs and development time.`
        },
        {
          heading: "What Python Is Used For",
          body: `| Field | Tools |\n|---|---|\n| Web Development | Django, FastAPI, Flask |\n| Data Science | pandas, NumPy, Jupyter |\n| Machine Learning | TensorFlow, PyTorch |\n| Automation | Selenium, scripts |\n| DevOps | Ansible, AWS Lambda |\n| Cybersecurity | Exploit scripts, Scapy |`
        },
        {
          heading: "Python vs Other Languages",
          body: `\`\`\`python\n# Python – hello world\nprint("Hello, World!")\n\`\`\`\n\`\`\`c\n// C – hello world\n#include <stdio.h>\nint main() { printf("Hello, World!\\n"); return 0; }\n\`\`\`\nPython executes **line by line** via an interpreter — no compilation step needed.`
        },
        {
          heading: "Python's Ecosystem",
          body: `PyPI (Python Package Index) hosts **500,000+ packages**. Installing any library takes one command:\n\`\`\`bash\npip install requests pandas matplotlib\n\`\`\``
        }
      ],
      takeaway: "Python's clean syntax, massive ecosystem, and versatility make it the top choice for beginners and professionals alike."
    },

    "if / elif / else": {
      intro: `Conditional statements let your program make decisions. In Python, they use **indentation** instead of braces to define blocks.`,
      sections: [
        {
          heading: "Basic if/else",
          body: `\`\`\`python\nscore = 82\n\nif score >= 90:\n    print("Grade: A")\nelif score >= 80:\n    print("Grade: B")   # This executes\nelif score >= 70:\n    print("Grade: C")\nelse:\n    print("Grade: F")\n\`\`\``
        },
        {
          heading: "Comparison Operators",
          body: `\`\`\`python\nx = 10\nx == 10   # True  – equal\nx != 5    # True  – not equal\nx > 5     # True  – greater than\nx <= 10   # True  – less than or equal\n\`\`\``
        },
        {
          heading: "Logical Operators",
          body: `\`\`\`python\nage = 20\nhas_id = True\n\nif age >= 18 and has_id:\n    print("Entry allowed")\n\nif age < 18 or not has_id:\n    print("Entry denied")\n\`\`\``
        },
        {
          heading: "Ternary (One-liner)",
          body: `\`\`\`python\nstatus = "pass" if score >= 50 else "fail"\nprint(status)  # pass\n\`\`\``
        }
      ],
      takeaway: "Python conditionals use indentation — be consistent with spaces (PEP-8 recommends 4 spaces) to avoid IndentationError."
    },

    // Java ────────────────────────────────────────────────────────────────────
    "What is Java and JVM?": {
      intro: `Java is a **class-based, object-oriented programming language** designed by James Gosling at Sun Microsystems (now Oracle) in 1995. Its motto: **Write Once, Run Anywhere**.`,
      sections: [
        {
          heading: "The JVM – Java Virtual Machine",
          body: `Java code doesn't compile to native machine code directly. It compiles to **bytecode** (.class files), which runs on the JVM:\n\`\`\`\nYour Code (.java)\n      ↓  javac (compiler)\n  Bytecode (.class)\n      ↓  JVM interprets/JIT compiles\nMachine Code runs on CPU\n\`\`\`\nThis is why Java runs on any OS that has a JVM installed.`
        },
        {
          heading: "JDK vs JRE vs JVM",
          body: `| Acronym | Stands For | Contains |\n|---|---|---|\n| JVM | Java Virtual Machine | Bytecode interpreter |\n| JRE | Java Runtime Environment | JVM + standard libraries |\n| JDK | Java Development Kit | JRE + compiler (javac) + tools |`
        },
        {
          heading: "Where Java Is Used",
          body: `- **Android Apps** – Dalvik/ART runs a form of Java bytecode\n- **Enterprise** – Spring Boot powers banking, insurance backends\n- **Big Data** – Hadoop, Spark are Java-based\n- **Web Servers** – Tomcat, JBoss\n- **Minecraft** – Written entirely in Java`
        },
        {
          heading: "Java vs C vs Python",
          body: `\`\`\`java\n// Java – verbose but explicit\npublic class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n\`\`\`\nJava is strongly typed, object-oriented by design, and prioritises reliability over brevity.`
        }
      ],
      takeaway: "The JVM is Java's killer feature — platform independence through bytecode abstraction. Understanding it helps you write better, more portable code."
    },

    // C++ ─────────────────────────────────────────────────────────────────────
    "What is C++ and Where is it Used?": {
      intro: `C++ is a **general-purpose, compiled, object-oriented language** created by Bjarne Stroustrup at Bell Labs in 1983 as a direct extension of C. It adds classes, templates, and the Standard Template Library to C's performance.`,
      sections: [
        {
          heading: "C vs C++",
          body: `\`\`\`cpp\n// C style\nstruct Point { int x; int y; };\nvoid print_point(struct Point p) {\n    printf("(%d, %d)\\n", p.x, p.y);\n}\n\n// C++ style – method inside class\nclass Point {\npublic:\n    int x, y;\n    void print() { std::cout << "(" << x << ", " << y << ")\\n"; }\n};\n\`\`\``
        },
        {
          heading: "Where C++ Dominates",
          body: `| Domain | Examples |\n|---|---|\n| Game Engines | Unreal Engine, CryEngine |\n| System Software | Windows NT kernel parts |\n| Browsers | Chrome (V8), Firefox |\n| Databases | MySQL, MongoDB |\n| Finance | High-frequency trading |\n| Graphics | OpenGL, Vulkan drivers |`
        },
        {
          heading: "The Zero-Cost Abstraction Philosophy",
          body: `C++ is designed so that abstractions (like classes, templates, STL) have **zero runtime overhead** compared to hand-written C. You get both high-level expressivity AND maximum performance.`
        }
      ],
      takeaway: "C++ is the language of choice when you need performance AND modern abstractions. It's harder to learn but offers unmatched control."
    },

    "Pointers Review": {
      intro: `Before diving into smart pointers and RAII, let's consolidate pointer fundamentals in a C++ context.`,
      sections: [
        {
          heading: "Raw Pointers in C++",
          body: `\`\`\`cpp\nint x = 42;\nint* ptr = &x;     // pointer to int\nstd::cout << *ptr;  // dereference → 42\n*ptr = 100;\nstd::cout << x;     // 100\n\`\`\``
        },
        {
          heading: "new and delete",
          body: `\`\`\`cpp\nint* p = new int(99);    // allocate on heap\nstd::cout << *p;          // 99\ndelete p;                  // free memory\np = nullptr;               // prevent dangling pointer\n\`\`\`\n⚠️ Every \`new\` must have exactly one \`delete\`. Forgetting causes a **memory leak**.`
        },
        {
          heading: "Pointer to Objects",
          body: `\`\`\`cpp\nstruct Dog { std::string name; void bark() { std::cout << "Woof!\\n"; } };\n\nDog* d = new Dog();\nd->name = "Rex";  // arrow operator for pointer to struct/class\nd->bark();        // Woof!\ndelete d;\n\`\`\``
        }
      ],
      takeaway: "Raw pointers are powerful but dangerous. In modern C++ (C++11+) prefer smart pointers — covered in the next lessons."
    },
  };

  // ─── Looked-up or generated content ─────────────────────────────────────────
  if (CONTENT_MAP[title]) return CONTENT_MAP[title];

  // Generic content generator based on type and title
  return generateContent(lesson, courseName, lang);
}

function generateContent(lesson, courseName, lang) {
  const { title, type } = lesson;

  const codeExamples = {
    "C Programming": "```c\n#include <stdio.h>\nint main() {\n    // " + title + " example\n    printf(\"Learning: " + title + "\\n\");\n    return 0;\n}\n```",
    "Python":        "```python\n# " + title + "\nprint('Learning: " + title + "')\n```",
    "Java":          "```java\npublic class Example {\n    public static void main(String[] args) {\n        // " + title + "\n        System.out.println(\"Learning: " + title + "\");\n    }\n}\n```",
    "C++":           "```cpp\n#include <iostream>\nint main() {\n    // " + title + "\n    std::cout << \"Learning: " + title + "\" << std::endl;\n    return 0;\n}\n```",
  };

  const bodies = {
    video:    `In this video lesson we cover **${title}** as part of the ${courseName} course.\n\nKey points covered:\n- Conceptual overview of ${title}\n- Practical demonstrations and live coding\n- Common mistakes and how to avoid them\n- Real-world applications\n\n${codeExamples[lang] || ""}`,
    reading:  `**${title}** is an essential concept in ${lang}.\n\nThis reading covers the theory and background you need before writing code. Study the key terms, rules, and patterns described here — you'll apply them in upcoming exercises.\n\n> 💡 **Tip:** Take notes as you read. Writing things down by hand dramatically improves retention!\n\n${codeExamples[lang] || ""}`,
    exercise: `## Exercise: ${title}\n\nTime to put your knowledge into practice! This hands-on exercise lets you apply what you've learned about **${title}**.\n\n**Instructions:**\n1. Read the problem statement carefully\n2. Plan your approach before writing any code\n3. Write the solution in ${lang}\n4. Test with the provided test cases\n5. Refactor for clarity\n\n${codeExamples[lang] || ""}\n\n**Test Cases:**\n\`\`\`\nInput:  [your test input]\nOutput: [expected output]\n\`\`\``,
    quiz:     `## Knowledge Check: ${title}\n\nAnswer the following questions based on what you've learned in this module.\n\n**Q1.** What is the primary purpose of ${title} in ${lang}?\n\n**Q2.** Which of the following best describes the behaviour?\n- A) Option one\n- B) Option two  ✓\n- C) Option three\n- D) Option four\n\n**Q3.** Write a short code snippet demonstrating ${title}.\n\n${codeExamples[lang] || ""}`,
  };

  return {
    intro: `This lesson covers **${title}** — an important concept in ${lang} and the ${courseName} curriculum.`,
    sections: [
      { heading: "Overview", body: bodies[type] || bodies.video },
      { heading: "Key Takeaways", body: `- Understand the fundamentals of **${title}**\n- Be able to apply this concept in your own ${lang} programs\n- Recognise real-world use cases\n- Move on confidently to the next lesson` }
    ],
    takeaway: `Mastering ${title} is a key step in becoming proficient in ${lang}. Practice the examples above before moving on.`
  };
}
