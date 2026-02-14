import { login, signup } from "./actions";
import { Building2 } from "lucide-react";

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const error = searchParams.error;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-6">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome to Equinox</h1>
                    <p className="text-sm text-muted-foreground">Sign in to book your meeting room.</p>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 text-center">
                        {error}
                    </div>
                )}

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <form className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder="you@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                formAction={login}
                                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Log in
                            </button>
                            <button
                                formAction={signup}
                                className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                            >
                                Sign up
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
