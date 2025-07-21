# Excel Diff Tool 📊

A modern, web-based tool for comparing Excel files and highlighting differences between sheets. 

![Excel Diff Tool Demo](https://img.shields.io/badge/status-active-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)

## 🌐 Live Demo

**[Try it now →](https://johnnythetank.github.io/excel-diff-tool/)**

## ✨ Features

- **🔒 Client-Side Processing**: Your files never leave your browser - complete privacyyar
- **📁 File Upload**: Drag and drop or browse to upload Excel files (.xlsx, .xls)
- **📋 Sheet Selection**: Choose specific sheets from each file to compare
- **🔍 Intelligent Comparison**: Advanced analysis to identify and highlight differences
- **📊 Visual Results**: Clear, tabular display of comparison results
- **🚀 Fast & Responsive**: Built with modern web technologies for optimal performance
- **📱 Mobile Friendly**: Works seamlessly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JohnnyTheTank/excel-diff-tool.git
   cd excel-diff-tool
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Usage

1. **Upload Files**: Select two Excel files you want to compare
2. **Choose Sheets**: Pick the specific sheets from each file
3. **Compare**: Click the compare button to analyze differences
4. **Review Results**: View highlighted differences in an easy-to-read table format

## 🏗️ Built With

- **[React 19](https://react.dev/)** - Modern React with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **Modern Architecture** - Clean, maintainable codebase

## 📁 Project Structure

```
excel-diff-tool/
├── components/
│   ├── ComparisonTable.tsx    # Results display component
│   ├── FileUpload.tsx         # File upload interface
│   ├── Icon.tsx               # Reusable icon component
│   └── Loader.tsx             # Loading state component
├── services/
│   └── excelComparer.ts       # Core comparison logic
├── App.tsx                    # Main application component
├── types.ts                   # TypeScript type definitions
└── index.tsx                  # Application entry point
```

## 🔧 Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn deploy` - Deploy to GitHub Pages

## 🚀 Deployment

This project is configured for easy deployment to GitHub Pages:

1. **Automatic Deployment**: Push to the `main` branch triggers automatic deployment
2. **Manual Deployment**: Run `yarn deploy` to deploy manually

The site will be available at: `https://johnnythetank.github.io/excel-diff-tool/`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- Powered by Vite for fast development
- Deployed on GitHub Pages
- Modern web technologies and clean architecture

## 📧 Contact

**JohnnyTheTank** - [@JohnnyTheTank](https://github.com/JohnnyTheTank)

Project Link: [https://github.com/JohnnyTheTank/excel-diff-tool](https://github.com/JohnnyTheTank/excel-diff-tool)

---

⭐ Star this repo if you find it helpful! 