import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="m15 5 4 4"></path>
              <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13"></path>
              <path d="m8 6 8 8"></path>
              <path d="m2 22 5.5-1.5L21.17 6.83a2.82 2.82 0 0 0-4-4L3.5 16.5Z"></path>
            </svg>
            <span>WatchTracker</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto py-12 space-y-8 px-4">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">About WatchTracker</h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Your personal entertainment companion for tracking movies and TV shows.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                WatchTracker was created with a simple mission: to help you keep track of your entertainment journey. We
                understand the frustration of forgetting which episode you're on or losing track of movies you want to
                watch.
              </p>
              <p className="text-muted-foreground">
                Our platform provides a seamless way to organize your watched content and discover new shows and movies
                tailored to your preferences.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border shadow-md">
              <img
                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
                alt="Movie theater with comfortable seats"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="border-t pt-8 mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Key Features</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
                    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
                    <path d="M12 2v2"></path>
                    <path d="M12 22v-2"></path>
                    <path d="m17 20.66-1-1.73"></path>
                    <path d="M11 10.27 7 3.34"></path>
                    <path d="m20.66 17-1.73-1"></path>
                    <path d="m3.34 7 1.73 1"></path>
                    <path d="M14 12h8"></path>
                    <path d="M2 12h2"></path>
                    <path d="m20.66 7-1.73 1"></path>
                    <path d="m3.34 17 1.73-1"></path>
                    <path d="m17 3.34-1 1.73"></path>
                    <path d="m7 20.66 1-1.73"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Watchlist</h3>
                <p className="text-muted-foreground">
                  Create and manage your watchlist of movies and TV shows you want to watch next.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                    <path d="m9 16 2 2 4-4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Episode Tracking</h3>
                <p className="text-muted-foreground">
                  Never miss a new episode with our upcoming episode tracker for your favorite shows.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-lg border">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Recommendations</h3>
                <p className="text-muted-foreground">
                  Discover new content based on your watching history and preferences.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4 w-12 h-12 flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <h3 className="text-lg font-bold">Sign Up</h3>
                <p className="text-muted-foreground">Create your free account to get started.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4 w-12 h-12 flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <h3 className="text-lg font-bold">Add Content</h3>
                <p className="text-muted-foreground">Search for your favorite movies and TV shows.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4 w-12 h-12 flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <h3 className="text-lg font-bold">Track Progress</h3>
                <p className="text-muted-foreground">Mark episodes as watched and track your progress.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4 w-12 h-12 flex items-center justify-center text-lg font-bold">
                  4
                </div>
                <h3 className="text-lg font-bold">Discover More</h3>
                <p className="text-muted-foreground">Get personalized recommendations based on your taste.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Link href="/register">
              <Button size="lg">Get Started Today</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
