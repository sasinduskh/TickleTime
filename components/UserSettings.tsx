import { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { generateShareId } from '../utils/generateShareId';
import { DollarSign, Link } from 'lucide-react';

interface UserSettingsProps {
  user: User;
  hourlyRate: number;
  publicShareId?: string;
}

export default function UserSettings({ user, hourlyRate, publicShareId }: UserSettingsProps) {
  const [newHourlyRate, setNewHourlyRate] = useState(hourlyRate.toString());

  const updateHourlyRate = async () => {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      hourlyRate: parseFloat(newHourlyRate) || 0,
    });
  };

  const generatePublicShareLink = async () => {
    const shareId = generateShareId();
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      publicShareId: shareId,
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
        <CardDescription>Manage your account settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4">
          <Input
            type="number"
            value={newHourlyRate}
            onChange={(e) => setNewHourlyRate(e.target.value)}
            placeholder="New Hourly Rate (LKR)"
            className="mr-2"
          />
          <Button onClick={updateHourlyRate} className="bg-black text-white hover:bg-gray-800">
            <DollarSign className="mr-2 h-4 w-4" /> Update Rate
          </Button>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Public Share Link:</h3>
          {publicShareId ? (
            <div>
              <Input 
                type="text" 
                value={`${window.location.origin}/user-report/${publicShareId}`} 
                readOnly 
                className="bg-gray-100"
              />
            </div>
          ) : (
            <Button onClick={generatePublicShareLink} className="bg-black text-white hover:bg-gray-800">
              <Link className="mr-2 h-4 w-4" /> Generate Public Share Link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

