# EasyPaste GPT 🚀

<div align="center">

![EasyPaste GPT](https://img.shields.io/badge/EasyPaste-GPT-4f46e5?style=for-the-badge)
[![Discord](https://img.shields.io/badge/AiCodingBattle-Join_Community-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/TH8V5b5rGR)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

*A powerful tool for seamless code project analysis and AI-driven modifications, brought to you by the AiCodingBattle Discord community.*

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Community](#community)

</div>

---

## 🌟 Features

- 📁 **Smart File Selection**: Easily select and manage files from your project
- 🔍 **Intelligent Filtering**: Built-in filters for common development files and folders
- 📝 **Prompt Generation**: Create well-structured prompts for AI tools like ChatGPT
- 🔄 **XML Integration**: Compatible with [o1-xml-parser](https://github.com/mckaywrigley/o1-xml-parser) for automated code changes
- 🎨 **Modern UI**: Clean and intuitive interface for a seamless experience
- ⚡ **Token Estimation**: Approximate token count for generated prompts

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AiCodingBattle/eazypaste.git
cd eazypaste
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the application:
```bash
npm run dev
# or
yarn dev
```

## 💡 Usage

1. **Launch the App**: Start EasyPaste GPT using the installation commands above
2. **Select Project**: Click "Select Folder" to choose your project directory
3. **Configure Files**: Use the Configuration panel to customize hidden files/folders
4. **Select Files**: Choose the relevant files from your project
5. **Generate Prompt**: The prompt will include your selected files and custom rules
6. **Copy & Use**: Copy the generated prompt and paste it into ChatGPT
7. **Process Changes**: Use [o1-xml-parser](https://github.com/mckaywrigley/o1-xml-parser) to apply the XML changes returned by ChatGPT

## 🔄 Workflow

1. EasyPaste GPT → Generate Prompt
2. ChatGPT → Process Prompt & Generate XML
3. o1-xml-parser → Apply Code Changes

## 🤝 Community

This tool is proudly provided by the **AiCodingBattle Discord Server** community. Join us to:
- Get support and help
- Share your experience
- Contribute to the project
- Connect with other developers

[![Join our Discord](https://img.shields.io/badge/Join_our_Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/TH8V5b5rGR)

## 🛠️ XML Parser Integration

EasyPaste GPT is designed to work seamlessly with [o1-xml-parser](https://github.com/mckaywrigley/o1-xml-parser) by McKay Wrigley. This integration allows you to:

1. Generate structured prompts with EasyPaste GPT
2. Get XML responses from ChatGPT
3. Automatically apply code changes using o1-xml-parser

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by the AiCodingBattle Community

[Join our Discord](https://discord.gg/TH8V5b5rGR) • [Report Bug](https://github.com/yourusername/eazypaste/issues) • [Request Feature](https://github.com/yourusername/eazypaste/issues)

</div>
