# Nano Banana Frontend

Modern React frontend for the Nano Banana image generation and editing application. Built with React 18, TypeScript, Tailwind CSS, and Vite.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will start on `http://localhost:5173` by default.

## Features

### 📝 Text-to-Image Generation (Create Mode)
- Write natural language prompts
- Select image size, style, and aspect ratio
- Real-time image preview
- Download generated images
- Save prompts for quick retry

### 🖼️ Image Editing (Edit Mode)
- Upload up to 10 images (JPEG/PNG, max 10MB each)
- Write detailed edit instructions
- Choose style and aspect ratio
- Download edited images
- Real-time upload preview

### 🔄 Mode Switching
- Seamlessly switch between Create and Edit modes
- Preferences preserved when switching
- Session history across modes
- Quick retry from recent prompts

### 📊 Session Management
- Automatic session creation
- Session restoration on reload
- View generation and edit history
- Track recently used prompts and settings

## Project Structure

```
src/
├── pages/              # Full-page components
│   ├── CreateMode.tsx
│   └── EditMode.tsx
├── components/         # Reusable components
│   ├── FileUpload.tsx
│   ├── StyleSelector.tsx
│   ├── ImagePreview.tsx
│   ├── EditInstructions.tsx
│   ├── UploadedImagePreview.tsx
│   ├── EditedImagePreview.tsx
│   ├── EditGenerateButton.tsx
│   ├── ModeSelector.tsx
│   ├── SessionHistory.tsx
│   ├── ImageGallery.tsx
│   └── GenerateButton.tsx
├── hooks/              # Custom React hooks
│   ├── useSession.ts
│   ├── useGeneration.ts
│   ├── useImageEdit.ts
│   ├── useModeSwitch.ts
│   └── useImageUpload.ts
├── services/           # API and external services
│   └── apiClient.ts
├── styles/             # Global styles
│   └── index.css
├── types/              # TypeScript definitions
│   └── index.ts
├── App.tsx             # Main app component
├── main.tsx            # App entry point
└── vite-env.d.ts       # Vite environment types
```

## Component Documentation

### Pages

#### CreateMode
Allows users to generate images from text prompts.

**Props:**
- `sessionData?: SessionData` - Session data with preferences

**Features:**
- Prompt input with character counter
- Style and size selection
- Real-time image preview
- Download functionality

#### EditMode
Allows users to edit and transform existing images.

**Props:**
- `sessionData?: SessionData` - Session data with preferences

**Features:**
- Drag-and-drop file upload
- Image preview grid
- Edit instructions with counter
- Style and aspect ratio options
- Download edited images

### Components

#### FileUpload
Handles image file uploads with drag-and-drop support.

```tsx
<FileUpload
  onFilesSelected={(files) => {}}
  maxFiles={10}
  disabled={false}
/>
```

#### EditInstructions
Input field for edit prompts with validation and character counter.

```tsx
<EditInstructions
  value={editPrompt}
  onChange={(value) => setEditPrompt(value)}
  maxLength={1000}
/>
```

#### UploadedImagePreview
Displays thumbnails of uploaded images.

```tsx
<UploadedImagePreview
  files={uploadedFiles}
  onRemove={(index) => removeFile(index)}
/>
```

#### EditedImagePreview
Displays edited images with download buttons.

```tsx
<EditedImagePreview
  images={editedImages}
  onClear={() => clearImages()}
/>
```

#### ModeSelector
Tab buttons for switching between Create and Edit modes.

```tsx
<ModeSelector
  activeMode="generation"
  onModeChange={(mode) => setMode(mode)}
/>
```

#### SessionHistory
Dropdown showing recent prompts and edits.

```tsx
<SessionHistory
  recentPrompts={[...]}
  recentEditPrompts={[...]}
  generationHistory={[...]}
  editHistory={[...]}
  onPromptSelect={(prompt, type) => {}}
/>
```

#### ImageGallery
Shows all session images with metadata and selection.

```tsx
<ImageGallery
  images={images}
  onImageSelect={(image) => {}}
  onImageUse={(image) => {}}
/>
```

### Hooks

#### useSession
Manages session state, initialization, and restoration.

```tsx
const {
  session,        // Current session data
  sessionId,      // Session ID
  loading,        // Loading state
  error,          // Error message
  initialized,    // Whether initialization complete
  initSession,    // Manually create new session
  updatePreferences,  // Update session preferences
  refreshSession  // Refresh session data
} = useSession();
```

#### useGeneration
Manages image generation state and API calls.

```tsx
const {
  images,         // Generated images
  loading,        // Loading state
  error,          // Error message
  taskState,      // Current task state
  generate,       // Generate images
  clearError      // Clear error
} = useGeneration();
```

#### useImageEdit
Manages image editing state and file uploads.

```tsx
const {
  uploadedFiles,      // Selected files
  editedImages,       // Edited images
  loading,            // Loading state
  error,              // Error message
  taskState,          // Current task state
  addFiles,           // Add files to upload
  removeFile,         // Remove file
  clearFiles,         // Clear all files
  editImages,         // Start edit task
  clearImages,        // Clear results
  clearError          // Clear error
} = useImageEdit();
```

#### useModeSwitch
Manages active mode and syncs with backend.

```tsx
const {
  activeMode,     // Current mode ('generation' or 'edit')
  setActiveMode,  // Switch mode
  isLoading,      // Sync loading state
  error           // Sync error
} = useModeSwitch('generation');
```

## API Integration

The frontend communicates with the backend via HTTP API. All requests include the session ID in the `X-Session-ID` header.

### Key API Methods

- `initSession()` - Create new session
- `getSession()` - Get current session
- `updatePreferences()` - Update user preferences
- `generateImages()` - Create generation task
- `getGenerationStatus()` - Poll generation status
- `editImages()` - Upload and create edit task
- `getEditStatus()` - Poll edit status
- `getGenerationOptions()` - Get available options
- `getEditOptions()` - Get edit options

See [backend README](../backend/README.md) for full API documentation.

## Styling

The application uses Tailwind CSS for styling. Key style files:

- `src/styles/index.css` - Global styles and Tailwind imports

### Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)
- Neutral: Gray (#6B7280)

## Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript types
npm run test        # Run tests
```

## State Management

The application uses React hooks for state management:

- **Session State**: `useSession` hook
- **Generation State**: `useGeneration` hook
- **Edit State**: `useImageEdit` hook
- **Mode State**: `useModeSwitch` hook
- **Local Component State**: React `useState`

Session data is restored from `localStorage` and synced with the backend on every request.

## Performance Optimizations

- **Code Splitting**: Routes are lazy-loaded with React.lazy
- **Image Lazy Loading**: Images use lazy loading for large galleries
- **Memoization**: Components use React.memo to prevent unnecessary re-renders
- **Debouncing**: Search and input fields are debounced
- **Request Caching**: Session data is cached with refresh capability

## Error Handling

All errors are caught and displayed to the user with friendly messages:

- Network errors: "Connection failed. Please check your internet."
- API errors: Backend error details displayed
- File errors: Clear validation messages
- Timeout errors: "Request timed out. Please try again."

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Deployment

See [DEPLOYMENT.md](../docs/DEPLOYMENT.md) for production deployment instructions.

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

MIT License - see LICENSE file for details
