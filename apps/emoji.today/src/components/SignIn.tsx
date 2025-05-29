"use client";

import { useState, useCallback } from "react";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import sdk, { SignIn as SignInCore } from "@farcaster/frame-sdk";
import { useSession } from "next-auth/react";
import { Button } from "./ui/Button";

export function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {status !== "authenticated" && (
        <>
          <Button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            isLoading={signingIn}
          >
            Sign In with Farcaster
          </Button>
          <p className="text-xs text-gray-400 text-center">
            By signing in with Farcaster, you accept our{" "}
            <a href="/terms" className="text-orange-500 hover:underline">
              Terms & Conditions
            </a>
          </p>
        </>
      )}
      {status === "authenticated" && (
        <Button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full border border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          isLoading={signingOut}
        >
          Sign out
        </Button>
      )}
      {signInFailure && !signingIn && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{signInFailure}</p>
        </div>
      )}
    </div>
  );
} 