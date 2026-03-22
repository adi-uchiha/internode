'use client';

import { useAuth } from '@/contexts/AuthContext';
import NextImage from 'next/image';
import { SessionDetails } from '@/components/shared/SessionDetails';
import type { Session } from '@/lib/auth-types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function UserCard({ session }: { session: Session }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <NextImage
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {session.user.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{session.user.email}</p>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-8 dark:border-gray-700">
        <SessionDetails session={session} />
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <button className="mt-6 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" />
          }
        >
          Sign Out
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign back in to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} variant="destructive">
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
