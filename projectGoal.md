Build me a desktop application using Electron and Vue with the following features and design requirements:
	1.	Folder Selection & Tree View
	•	Let me pick a folder from my local machine (commonly from the Desktop).
	•	Show a folder tree structure inside the app, but exclude (hide) certain files/folders by default (e.g. .git, node_modules, .env).
	•	Provide a simple configuration panel where I can list which folders or files to hide.
	2.	File Selection & Prompt Creation
	•	Allow me to select multiple files from the folder tree.
	•	For each selected file, gather its full code content and prepare a combined prompt.
	•	The final prompt should contain:
	•	Intro/Rules (editable text at the top)
	•	User’s Task (what I want to add or fix)
	•	All code content from the selected files, concatenated in a readable format (e.g., with file headers or markdown).
	•	Provide a “Copy to Clipboard” button that copies the entire prompt (rules + task + code) in one click.
	3.	Live Token Count
	•	Display a live token count (or approximate) reflecting the selected files’ code, plus the text I add to the prompt.
	•	Update this count in real time whenever I add/remove files or modify the prompt text.
	4.	Local Saving
	•	Save all important app data (the chosen folder path, the hidden-file configuration, the intro/rules text, the selected files, etc.) locally.
	•	Ensure that if the user closes the app and reopens it, everything is restored (the same folder, the same selections, the same text/rules).
	5.	Look & Feel
	•	Dark Mode theme inspired by Discord or VSCode dark styling.
	•	A clean, modern interface with easily distinguishable sections for the folder tree, selected files, and prompt creation.
	6.	Technical Implementation
	•	Use Electron for the desktop app framework.
	•	Use Vue (3.x preferred) for the UI layer.
	•	Structure the project in a way that is easy to maintain, with clear separation between the main (Electron) process and renderer (Vue) process.
	•	Provide minimal set up instructions, or script, to install dependencies and run/pack the app.

Additional Notes
	•	The main goal is to help me quickly create a prompt (including code context) that I can feed to ChatGPT to troubleshoot or improve my code.
	•	The list of hidden files/folders should be user-configurable.
	•	If possible, show a small preview of each file when selecting, but the main purpose is to gather the full text for the final prompt.
	•	Make sure each step is well-documented or logically placed so I can tweak, build, and deploy the app across different machines.

Now, please provide:
	1.	A step-by-step guide on setting up the Electron+Vue project with these requirements.
	2.	Sample code (in separate files if possible) demonstrating how to implement each main feature (folder selection, file reading, prompt building, token counting, hidden folder config, local data saving, etc.).
	3.	Design recommendations (CSS, SCSS, or styling approach) to achieve the dark mode layout similar to Discord or VSCode.