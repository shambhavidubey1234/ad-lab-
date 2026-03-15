import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Event,
  Timeline,
  BarChart,
  Download,
  Refresh,
  CalendarToday,
  HowToReg,
} from '@mui/icons-material';
import {
  getSystemPulse,
  getUserBehavior,
  getClubPerformance,
  exportSystemReport,
  getAllClubs,
  getAllEvents,
} from '../../services/api';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Analytics data states
  const [systemPulse, setSystemPulse] = useState(null);
  const [userBehavior, setUserBehavior] = useState(null);
  const [clubPerformance, setClubPerformance] = useState(null);
  
  // Data states
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
    
    // Listen for updates from ClubManagement
    const handleDataUpdate = () => {
      console.log('🔄 Data updated, refreshing...');
      loadAnalyticsData();
    };

    window.addEventListener('performance-updated', handleDataUpdate);
    window.addEventListener('registration-updated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('performance-updated', handleDataUpdate);
      window.removeEventListener('registration-updated', handleDataUpdate);
    };
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all data in parallel
      const [
        pulseRes,
        behaviorRes,
        clubPerfRes,
        clubsRes,
        eventsRes,
      ] = await Promise.allSettled([
        getSystemPulse(),
        getUserBehavior(),
        getClubPerformance(),
        getAllClubs({ limit: 100 }),
        getAllEvents(),
      ]);

      if (pulseRes.status === 'fulfilled') {
        console.log('System Pulse Data:', pulseRes.value.data);
        setSystemPulse(pulseRes.value.data);
      }
      
      if (behaviorRes.status === 'fulfilled') {
        console.log('User Behavior Data:', behaviorRes.value.data);
        setUserBehavior(behaviorRes.value.data);
      }
      
      if (clubPerfRes.status === 'fulfilled') {
        console.log('Club Performance Data:', clubPerfRes.value.data);
        setClubPerformance(clubPerfRes.value.data);
      }

      if (clubsRes.status === 'fulfilled') {
        console.log('Clubs Data:', clubsRes.value.data);
        setClubs(clubsRes.value.data.data || []);
      }

      if (eventsRes.status === 'fulfilled') {
        console.log('Events Data:', eventsRes.value.data);
        let eventsArray = [];
        if (eventsRes.value.data?.events) {
          eventsArray = eventsRes.value.data.events;
        } else if (Array.isArray(eventsRes.value.data)) {
          eventsArray = eventsRes.value.data;
        }
        setEvents(eventsArray);
      }

    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await exportSystemReport();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system_report_${new Date().toISOString()}.csv`;
      link.click();
    } catch (err) {
      setError('Failed to export report');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getHealthColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY': return 'success';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Prepare chart data for Event Intelligence - USING confirmedCount DIRECTLY
  const getEventChartData = () => {
    const topEvents = events
      .map(event => ({
        name: event.title || 'Untitled',
        registrations: event.confirmedCount || 0, // Use confirmedCount directly
        date: event.date,
      }))
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10);

    return {
      labels: topEvents.map(e => e.name.length > 15 ? e.name.substring(0, 12) + '...' : e.name),
      datasets: [
        {
          label: 'Confirmed Registrations',
          data: topEvents.map(e => e.registrations),
          backgroundColor: 'rgba(232, 156, 49, 0.8)',
          borderColor: 'rgba(232, 156, 49, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Events by Confirmed Registrations',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Confirmed Registrations',
        },
      },
    },
  };

  if (loading && !systemPulse) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading analytics dashboard...
        </Typography>
      </Container>
    );
  }

  // Extract data from systemPulse
  const totalUsers = systemPulse?.data?.stats?.totalUsers || 0;
  const totalEvents = systemPulse?.data?.stats?.totalEvents || 0;
  const activeEvents = systemPulse?.data?.stats?.activeEvents || 0;
  const totalClubs = systemPulse?.data?.stats?.totalClubs || 0;
  const eventApprovalRate = systemPulse?.data?.stats?.eventApprovalRate || 0;
  const weeklyActiveUsers = systemPulse?.data?.stats?.weeklyActiveUsers || 0;
  const systemHealth = systemPulse?.data?.systemHealth || 'UNKNOWN';

  // Role distribution from userBehavior
  const students = userBehavior?.data?.roleDistribution?.students || 0;
  const clubAdmins = userBehavior?.data?.roleDistribution?.clubAdmins || 0;
  const superAdmins = userBehavior?.data?.roleDistribution?.superAdmins || 0;
  const totalUsersFromBehavior = userBehavior?.data?.roleDistribution?.total || totalUsers;

  // Calculate total registrations using confirmedCount
  const totalRegistrations = events.reduce((sum, event) => sum + (event.confirmedCount || 0), 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              📊 Analytics Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced analytics and insights for system monitoring
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadAnalyticsData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportReport}
            >
              Export Report
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* System Health Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h3">
                {totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Total Events</Typography>
              </Box>
              <Typography variant="h3">
                {totalEvents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeEvents} active events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Total Clubs</Typography>
              </Box>
              <Typography variant="h3">
                {totalClubs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Clubs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">System Health</Typography>
              </Box>
              <Chip
                label={systemHealth}
                color={getHealthColor(systemHealth)}
                sx={{ mb: 1, fontWeight: 'bold' }}
              />
              <Typography variant="body2" color="text.secondary">
                Approval Rate: {eventApprovalRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role Distribution Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Distribution
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Students</Typography>
                  <Typography fontWeight="bold">{students}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalUsersFromBehavior ? (students / totalUsersFromBehavior) * 100 : 0} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }} 
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Club Admins</Typography>
                  <Typography fontWeight="bold">{clubAdmins}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalUsersFromBehavior ? (clubAdmins / totalUsersFromBehavior) * 100 : 0} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }} 
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Super Admins</Typography>
                  <Typography fontWeight="bold">{superAdmins}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalUsersFromBehavior ? (superAdmins / totalUsersFromBehavior) * 100 : 0} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Weekly Active Users</Typography>
                  <Typography fontWeight="bold">{weeklyActiveUsers}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalUsers ? (weeklyActiveUsers / totalUsers) * 100 : 0} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }} 
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Event Approval Rate</Typography>
                  <Typography fontWeight="bold">{eventApprovalRate}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={eventApprovalRate} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="User Analytics" icon={<People />} iconPosition="start" />
          <Tab label="Club Performance" icon={<BarChart />} iconPosition="start" />
          <Tab label="Event Intelligence" icon={<Event />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* User Analytics Tab */}
      {activeTab === 0 && userBehavior && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Behavior Metrics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Daily Active Users</TableCell>
                      <TableCell align="right">{userBehavior?.data?.dailyActiveUsers || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Weekly Active Users</TableCell>
                      <TableCell align="right">{userBehavior?.data?.weeklyActiveUsers || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>New Users (30 days)</TableCell>
                      <TableCell align="right">{userBehavior?.data?.newUsers || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Returning Users</TableCell>
                      <TableCell align="right">{userBehavior?.data?.returningUsers || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Club Performance Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Club Performance
                </Typography>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={loadAnalyticsData}
                >
                  Refresh Data
                </Button>
              </Box>
              
              {clubs.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Club Name</TableCell>
                        <TableCell>Performance Score</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {clubs
                        .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
                        .map((club, index) => {
                          const performanceScore = club.performanceScore || 0;
                          
                          return (
                            <TableRow key={club._id || index}>
                              <TableCell>
                                <Chip 
                                  label={`#${index + 1}`} 
                                  size="small" 
                                  color={index === 0 ? 'success' : index === 1 ? 'primary' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight="medium">{club.name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 100 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={performanceScore} 
                                      color={performanceScore >= 80 ? 'success' : performanceScore >= 60 ? 'primary' : 'warning'}
                                    />
                                  </Box>
                                  <Typography fontWeight="bold">{performanceScore}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={club.category || 'General'} 
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={club.isActive ? 'Active' : 'Inactive'} 
                                  color={club.isActive ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No club performance data available</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Event Intelligence Tab - USING confirmedCount DIRECTLY */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Event sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Total Events</Typography>
                </Box>
                <Typography variant="h3">{events.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HowToReg sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Confirmed Registrations</Typography>
                </Box>
                <Typography variant="h3">{totalRegistrations}</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarToday sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Avg per Event</Typography>
                </Box>
                <Typography variant="h3">
                  {events.length > 0 ? Math.round(totalRegistrations / events.length) : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Bar Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Event Registration Trends
              </Typography>
              <Box sx={{ height: 400 }}>
                {events.length > 0 ? (
                  <Bar data={getEventChartData()} options={chartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No event data available</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Event Details Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Event Details
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Event Name</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Confirmed Registrations</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {events.length > 0 ? (
                      events
                        .sort((a, b) => (b.confirmedCount || 0) - (a.confirmedCount || 0))
                        .map((event) => (
                          <TableRow key={event._id} hover>
                            <TableCell>
                              <Typography fontWeight="medium">{event.title || 'Untitled'}</Typography>
                            </TableCell>
                            <TableCell>{formatDate(event.date)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={event.confirmedCount || 0} 
                                size="small"
                                color={event.confirmedCount > 50 ? 'success' : event.confirmedCount > 20 ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={event.status || 'published'} 
                                size="small"
                                color={event.status === 'published' ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={event.category || 'General'} 
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No events found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Last Updated */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Data from API • Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default AnalyticsDashboard;