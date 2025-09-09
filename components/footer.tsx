export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© {currentYear} WatchTracker. All rights reserved.</p>
          <p className="text-sm text-muted-foreground mt-2 sm:mt-0">Made with ❤️ and ☕ by Rhythm Pandya</p>
        </div>
      </div>
    </footer>
  )
}
