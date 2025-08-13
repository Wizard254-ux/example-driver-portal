import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { subscriptionService } from '../services/subscription';
import { useToast } from '@/hooks/use-toast';

interface WalletTransaction {
  id: number;
  amount: string;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

interface WalletData {
  balance: string;
  currency: string;
  transactions: WalletTransaction[];
}

export const WalletBalance: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const data = await subscriptionService.getWalletBalance();
      setWalletData(data);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!walletData) return null;

  const balance = parseFloat(walletData.balance);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${balance.toFixed(2)} {walletData.currency}
        </div>
        {balance > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Available for future purchases
          </p>
        )}
        
        {walletData.transactions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {walletData.transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {transaction.type === 'credit' ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className="truncate max-w-32">{transaction.description}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'} className="text-xs">
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalance;