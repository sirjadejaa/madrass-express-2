"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UtensilsCrossed } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function LoginPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Invalid email or password.",
        });
      } else {
        toast({
          title: "Welcome back",
          description: "Successfully signed in to the dashboard.",
        });
        router.push("/admin");
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950">
      {/* Left Panel - Subtle South Indian Aesthetic / Branding */}
      <div className="hidden lg:flex w-1/2 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent opacity-50 dark:opacity-20" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E\")", backgroundSize: "30px 30px" }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <UtensilsCrossed className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Madrass Express</h1>
          </div>
        </div>
        
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight mb-4 text-zinc-900 dark:text-zinc-100">
            Premium Restaurant <br/>Management System
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Streamline your orders, kitchen operations, and customer experience with our integrated platform.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex justify-center lg:hidden mb-6">
              <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <UtensilsCrossed className="text-white h-8 w-8" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-700 dark:text-zinc-300 font-medium">Email address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin@example.com" 
                          className="h-12 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 transition-colors focus:bg-white dark:focus:bg-zinc-900" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-zinc-700 dark:text-zinc-300 font-medium">Password</FormLabel>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="h-12 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 transition-colors focus:bg-white dark:focus:bg-zinc-900"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-transform" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Secure, encrypted authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
