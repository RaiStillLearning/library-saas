"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "../hooks/use-auth";
import { loginSchema, registerSchema, LoginInput, RegisterInput } from "../schemas/auth-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // 1. Define form for Login
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define form for Registration
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  // 3. Handle Submit
  const onLoginSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    try {
      const success = await signIn(values.email, values.password);
      if (success) {
        // Fetch role to redirect to correct page
        // Standard profiles default email role mapping
        const lowercaseEmail = values.email.toLowerCase();
        if (lowercaseEmail.includes("admin")) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterInput) => {
    setIsLoading(true);
    try {
      const success = await signUp(values.email, values.password, values.name);
      if (success) {
        if (values.email.toLowerCase().includes("admin")) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300">
      <div className="flex flex-col space-y-2 text-left mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {isRegister ? "Create an account" : "Welcome back"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isRegister
            ? "Enter your details to register a new account"
            : "Enter your credentials to access your library"}
        </p>
      </div>

      {!isRegister ? (
        <Form {...loginForm} key="login-form-provider">
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Password</FormLabel>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.info("Password reset functionality is not implemented yet in the mock database.");
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Enter your password"
                      type="password"
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-200 dark:shadow-none"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...registerForm} key="register-form-provider">
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
            <FormField
              control={registerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      type="text"
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300 font-medium">Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Create a password"
                      type="password"
                      className="rounded-xl h-11 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-200 dark:shadow-none"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        </Form>
      )}

      <div className="mt-8 text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
        </span>
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            loginForm.reset();
            registerForm.reset();
          }}
          className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors"
        >
          {isRegister ? "Sign in" : "Sign up"}
        </button>
      </div>
    </div>
  );
}
