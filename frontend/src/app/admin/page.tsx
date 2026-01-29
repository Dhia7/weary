'use client';

import { useEffect, useState } from 'react';
import { useAuthorizedFetch } from '@/lib/admin';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  UserCheck,
  Globe,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  usersWithAddresses: number;
  recentUsers: number;
  usersByCountry: Array<{ country: string; count: number }>;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  revenueLast30Days: number;
  revenuePrevious30Days: number;
  revenueGrowth: string;
  ordersGrowth: string;
  topProducts: Array<{ 
    Product?: { id?: number; name?: string; price?: number; avgPriceCents?: number } | null; 
    orderCount: number; 
    totalQuantity: number;
    totalRevenueCents?: number;
  }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  usersByDay: Array<{ date: string; users: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; orders: number }>;
  ordersByDayOfWeek: Array<{ day: string; count: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// Color mapping for order statuses
const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  const colorMap: Record<string, string> = {
    'pending': '#f59e0b',      // Amber/Orange
    'paid': '#6366f1',         // Indigo
    'processing': '#8b5cf6',   // Purple
    'shipped': '#06b6d4',      // Cyan
    'delivered': '#10b981',    // Green
    'cancelled': '#ef4444',    // Red
    'refunded': '#ec4899',     // Pink
    'failed': '#6b7280',       // Gray
    'on-hold': '#f97316',      // Orange
    'completed': '#059669',    // Darker/More Green (emerald-600)
  };
  return colorMap[statusLower] || COLORS[statusLower.charCodeAt(0) % COLORS.length];
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Revenue' ? `$${((entry.value || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const fetcher = useAuthorizedFetch();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '6m'>('30d');

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetcher('/admin/dashboard');
      const json = await res.json().catch(() => ({}));
      
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        const errorMessage = json.message || json.error || `HTTP ${res.status}: ${res.statusText}` || 'Failed to load dashboard data';
        console.error('Failed to fetch dashboard data:', {
          status: res.status,
          statusText: res.statusText,
          response: json
        });
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error: Unable to connect to the server. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  // Prepare chart data with colors
  const ordersByStatusChartData = data?.ordersByStatus?.map(status => ({
    name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
    value: status.count,
    count: status.count,
    status: status.status,
    color: getStatusColor(status.status)
  })) || [];

  const usersByCountryChartData = data?.usersByCountry?.slice(0, 7).map(country => ({
    name: country.country || 'Unknown',
    value: country.count,
    users: country.count
  })) || [];

  const topProductsChartData = data?.topProducts?.slice(0, 10).map((product, index) => {
    // Use actual revenue from backend if available, otherwise calculate from avg price
    const revenue = product.totalRevenueCents 
      ? product.totalRevenueCents / 100 
      : ((product.Product?.avgPriceCents || product.Product?.price || 0) / 100) * product.totalQuantity;
    
    return {
      name: product.Product?.name?.substring(0, 20) || `Product ${index + 1}`,
      orders: product.orderCount,
      sold: product.totalQuantity,
      revenue: revenue
    };
  }) || [];

  // Time-series data
  const revenueChartData = timeRange === '7d' 
    ? data?.revenueByDay?.slice(-7) || []
    : timeRange === '30d'
    ? data?.revenueByDay || []
    : data?.revenueByMonth || [];

  const usersChartData = data?.usersByDay || [];

  // Calculate percentages
  const activeUsersPercentage = data?.totalUsers 
    ? Math.round((data.activeUsers / data.totalUsers) * 100) 
    : 0;
  const verifiedUsersPercentage = data?.totalUsers 
    ? Math.round((data.verifiedUsers / data.totalUsers) * 100) 
    : 0;
  const activeProductsPercentage = data?.totalProducts 
    ? Math.round((data.activeProducts / data.totalProducts) * 100) 
    : 0;

  // Calculate growth indicators
  const revenueGrowthNum = parseFloat(data?.revenueGrowth || '0');
  const ordersGrowthNum = parseFloat(data?.ordersGrowth || '0');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              variant={timeRange === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="h-8"
            >
              7D
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="h-8"
            >
              30D
            </Button>
            <Button
              variant={timeRange === '6m' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('6m')}
              className="h-8"
            >
              6M
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to Load Dashboard</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchDashboardData()}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid with Growth Indicators */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue (30d)"
              value={formatPrice((data?.revenueLast30Days || 0) / 100)}
              icon={DollarSign}
              trend={revenueGrowthNum}
              trendLabel="vs previous period"
              color="yellow"
              isPercentage
              showGrowth
            />
            <StatCard
              title="Total Orders"
              value={data?.totalOrders || 0}
              icon={ShoppingCart}
              trend={ordersGrowthNum}
              trendLabel="vs previous period"
              color="purple"
              isPercentage
              showGrowth
            />
            <StatCard
              title="Total Users"
              value={data?.totalUsers || 0}
              icon={Users}
              trend={data?.recentUsers || 0}
              trendLabel="new this month"
              color="blue"
            />
            <StatCard
              title="Total Products"
              value={data?.totalProducts || 0}
              icon={Package}
              trend={activeProductsPercentage}
              trendLabel="active"
              color="green"
              isPercentage
            />
          </div>

          {/* Comprehensive Revenue & Orders Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue & Orders Trend</CardTitle>
                  <CardDescription>
                    {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 6 months'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 border-green-500/50 bg-green-500/10">
                    <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-semibold">Revenue</span>
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-indigo-500/50 bg-indigo-500/10">
                    <ShoppingCart className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Orders</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis 
                    dataKey={timeRange === '6m' ? 'month' : 'date'} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (timeRange === '6m') return value;
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#10b981', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', style: { fill: '#10b981', fontWeight: 600 } }}
                    stroke="#10b981"
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#6366f1', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'Orders', angle: 90, position: 'insideRight', style: { fill: '#6366f1', fontWeight: 600 } }}
                    stroke="#6366f1"
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                    formatter={(value: string) => {
                      if (value === 'Revenue') {
                        return <span style={{ color: '#10b981', fontWeight: 600 }}>Revenue</span>;
                      }
                      return <span style={{ color: '#6366f1', fontWeight: 600 }}>Orders</span>;
                    }}
                  />
                  {/* Revenue - Line with Area fill */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    fill="#10b981"
                    fillOpacity={0.15}
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Revenue"
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  {/* Orders - Line with Area fill */}
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    fill="#6366f1"
                    fillOpacity={0.15}
                    stroke="#6366f1"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Orders"
                    dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="h-4 w-4 mr-2" />
                Products
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Orders by Status Chart - Compact Horizontal Bar */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Orders by Status</CardTitle>
                    <CardDescription>Distribution of orders across different statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersByStatusChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart 
                          data={ordersByStatusChartData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            width={100}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            radius={[0, 4, 4, 0]}
                            maxBarSize={40}
                          >
                            {ordersByStatusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                        No order data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Users by Country */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                    <CardDescription>Users by country</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersByCountryChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={usersByCountryChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {usersByCountryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No country data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={usersChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString();
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Orders by Status - Compact Donut Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>Visual breakdown of order statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersByStatusChartData.length > 0 ? (
                      <div className="flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={ordersByStatusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="count"
                              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {ordersByStatusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                          {ordersByStatusChartData.map((item) => {
                            return (
                              <div key={item.name} className="flex items-center gap-2 text-xs">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-medium capitalize">{item.name}</span>
                                <span className="text-muted-foreground ml-auto">{item.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No order data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Orders by Day of Week */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders by Day of Week</CardTitle>
                    <CardDescription>Order distribution throughout the week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.ordersByDayOfWeek && data.ordersByDayOfWeek.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.ordersByDayOfWeek}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="day" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[220px] text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Products Performance</CardTitle>
                  <CardDescription>Best performing products by orders and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  {topProductsChartData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={topProductsChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={150} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="orders" fill="#10b981" name="Orders" />
                          <Bar dataKey="sold" fill="#8b5cf6" name="Units Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                      <Separator className="my-6" />
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Units Sold</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.topProducts?.slice(0, 10).map((product, index) => {
                            // Use average price actually paid, fallback to current product price
                            const avgPriceCents = product.Product?.avgPriceCents || product.Product?.price || 0;
                            const avgPrice = avgPriceCents / 100;
                            
                            // Use actual revenue from backend if available
                            const revenue = product.totalRevenueCents 
                              ? product.totalRevenueCents / 100 
                              : avgPrice * product.totalQuantity;
                            
                            return (
                              <TableRow key={product.Product?.id || index}>
                                <TableCell className="font-medium">
                                  {product.Product?.name || 'Unknown Product'}
                                </TableCell>
                                <TableCell>
                                  {formatPrice(avgPrice)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{product.orderCount}</Badge>
                                </TableCell>
                                <TableCell>{product.totalQuantity}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatPrice(revenue)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No product data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data?.activeUsers || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeUsersPercentage}% of total users
                    </p>
                    <Progress value={activeUsersPercentage} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data?.verifiedUsers || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {verifiedUsersPercentage}% of total users
                    </p>
                    <Progress value={verifiedUsersPercentage} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Recent Users</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data?.recentUsers || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered in last 30 days
                    </p>
                  </CardContent>
                </Card>
              </div>

              {data?.usersByCountry && data.usersByCountry.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Country</CardTitle>
                    <CardDescription>Geographic distribution of users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead className="text-right">Users</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.usersByCountry.map((country, index) => (
                          <TableRow key={country.country || index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                                {country.country || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{country.count}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Revenue Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Comparison</CardTitle>
                    <CardDescription>Last 30 days vs Previous 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Period</span>
                        <span className="text-2xl font-bold">
                          {formatPrice((data?.revenueLast30Days || 0) / 100)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Previous Period</span>
                        <span className="text-xl">
                          {formatPrice((data?.revenuePrevious30Days || 0) / 100)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Growth</span>
                        <div className="flex items-center gap-1">
                          {revenueGrowthNum >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-lg font-semibold ${revenueGrowthNum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(revenueGrowthNum)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Revenue Trend</CardTitle>
                    <CardDescription>Revenue over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.revenueByMonth && data.revenueByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data.revenueByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number | undefined) => formatPrice((value || 0) / 100)} />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            dot={{ fill: '#f59e0b', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button asChild variant="outline" className="h-auto flex-col items-start py-4">
                  <Link href="/admin/users">
                    <Users className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Manage Users</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      View and manage user accounts
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col items-start py-4">
                  <Link href="/admin/products">
                    <Package className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Manage Products</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Add, edit, or remove products
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col items-start py-4">
                  <Link href="/admin/orders">
                    <ShoppingCart className="h-5 w-5 mb-2" />
                    <span className="font-semibold">View Orders</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Track and manage orders
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendLabel,
  color,
  isPercentage = false,
  showGrowth = false
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
  color: string;
  isPercentage?: boolean;
  showGrowth?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  const trendColor = trend && trend > 0 
    ? 'text-green-600 dark:text-green-400' 
    : trend && trend < 0
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && trendLabel && (
          <p className={`text-xs flex items-center mt-1 ${trendColor}`}>
            {showGrowth && trend !== 0 ? (
              <>
                <TrendIcon className="h-3 w-3 mr-1" />
                {Math.abs(trend)}{isPercentage ? '%' : ''} {trendLabel}
              </>
            ) : isPercentage ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend}% {trendLabel}
              </>
            ) : (
              <>
                {trend > 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {trend} {trendLabel}
              </>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
