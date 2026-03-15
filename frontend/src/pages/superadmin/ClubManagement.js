import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Delete,
  School,
  PersonAdd,
  Refresh,
  Add,
  TrendingUp,
  People,
  Event,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import { 
  getAllClubs, 
  deleteClub, 
  updateClubPerformance, 
  updateClubStatus 
} from '../../services/api';

const ClubManagement = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClubs, setTotalClubs] = useState(0);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [newPerformanceScore, setNewPerformanceScore] = useState(0);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    fetchClubs();
  }, [page, rowsPerPage, searchTerm]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
      };
      const response = await getAllClubs(params);
      setClubs(response.data.data || []);
      setTotalClubs(response.data.total || 0);
    } catch (err) {
      setError('Failed to load clubs');
      console.error('Clubs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, club) => {
    setAnchorEl(event.currentTarget);
    setSelectedClub(club);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClub = async () => {
    try {
      await deleteClub(selectedClub._id);
      fetchClubs();
      setDeleteDialogOpen(false);
    } catch (err) {
      setError('Failed to delete club');
    }
  };

  const handleUpdatePerformance = async () => {
    try {
      await updateClubPerformance(selectedClub._id, newPerformanceScore);
      fetchClubs();
      setPerformanceDialogOpen(false);
    } catch (err) {
      setError('Failed to update performance score');
    }
  };

  // ✅ NEW: Toggle club status
  const handleToggleStatus = async () => {
    try {
      const newStatus = !selectedClub.isActive;
      await updateClubStatus(selectedClub._id, { isActive: newStatus });
      
      // Update local state
      setClubs(clubs.map(club => 
        club._id === selectedClub._id ? { ...club, isActive: newStatus } : club
      ));
      
      setStatusDialogOpen(false);
      alert(`Club ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      setError('Failed to update club status');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'TECHNICAL': 'primary',
      'CULTURAL': 'secondary',
      'SPORTS': 'success',
      'LITERARY': 'warning',
      'SOCIAL': 'info',
      'OTHER': 'default',
    };
    return colors[category] || 'default';
  };

  if (loading && clubs.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading clubs...
        </Typography>
      </Container>
    );
  }

  // Calculate statistics
  const stats = {
    totalClubs: clubs.length,
    activeClubs: clubs.filter(c => c.isActive).length,
    averagePerformance: clubs.length > 0 
      ? (clubs.reduce((sum, club) => sum + (club.performanceScore || 0), 0) / clubs.length).toFixed(1)
      : 0,
    topClub: clubs.length > 0 
      ? clubs.reduce((max, club) => (club.performanceScore || 0) > (max.performanceScore || 0) ? club : max)
      : null,
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🏛️ Club Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all college clubs, performance metrics, and presidents
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <School sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Clubs</Typography>
              </Box>
              <Typography variant="h3">{stats.totalClubs}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Active Clubs</Typography>
              </Box>
              <Typography variant="h3">{stats.activeClubs}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Avg Performance</Typography>
              </Box>
              <Typography variant="h3">{stats.averagePerformance}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Event sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Top Club</Typography>
              </Box>
              <Typography variant="body1">
                {stats.topClub ? stats.topClub.name : 'N/A'}
              </Typography>
              {stats.topClub && (
                <Chip
                  label={`Score: ${stats.topClub.performanceScore || 0}`}
                  color={getPerformanceColor(stats.topClub.performanceScore || 0)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
            <TextField
              size="small"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <Button type="submit" variant="contained">
              Search
            </Button>
          </form>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchClubs}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => window.location.href = '/register?role=club_admin'}
            >
              Create Club
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Clubs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Club Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>President</TableCell>
              <TableCell>Performance Score</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Events</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No clubs found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clubs.map((club) => (
                <TableRow key={club._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School />
                      <Box>
                        <Typography variant="body2">{club.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {club.presidentEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={club.category || 'OTHER'}
                      color={getCategoryColor(club.category)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {club.president || 'Not assigned'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '100px', mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={club.performanceScore || 0}
                          color={getPerformanceColor(club.performanceScore || 0)}
                        />
                      </Box>
                      <Typography variant="body2">
                        {club.performanceScore || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{club.memberCount || 1}</TableCell>
                  <TableCell>{club.eventCount || 0}</TableCell>
                  <TableCell>
                    <Chip
                      label={club.isActive ? 'Active' : 'Inactive'}
                      color={club.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {/* ✅ NEW: Activate/Deactivate Button */}
                      <Button
                        size="small"
                        variant="contained"
                        color={club.isActive ? 'error' : 'success'}
                        onClick={() => {
                          setSelectedClub(club);
                          setStatusDialogOpen(true);
                        }}
                        startIcon={club.isActive ? <ToggleOff /> : <ToggleOn />}
                      >
                        {club.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, club)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalClubs}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setNewPerformanceScore(selectedClub?.performanceScore || 0);
          setPerformanceDialogOpen(true);
          handleMenuClose();
        }}>
          <TrendingUp sx={{ mr: 1 }} /> Update Performance
        </MenuItem>
        <MenuItem onClick={() => {
          // Navigate to assign admin page
          window.location.href = `/super-admin/clubs/${selectedClub?._id}/assign`;
          handleMenuClose();
        }}>
          <PersonAdd sx={{ mr: 1 }} /> Assign President
        </MenuItem>
        <MenuItem onClick={() => {
          setDeleteDialogOpen(true);
          handleMenuClose();
        }}>
          <Delete sx={{ mr: 1 }} /> Delete Club
        </MenuItem>
      </Menu>

      {/* Update Performance Dialog */}
      <Dialog open={performanceDialogOpen} onClose={() => setPerformanceDialogOpen(false)}>
        <DialogTitle>Update Performance Score</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Club: {selectedClub?.name}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Performance Score (0-100)"
            value={newPerformanceScore}
            onChange={(e) => setNewPerformanceScore(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
            sx={{ mt: 2 }}
          />
          <LinearProgress 
            variant="determinate" 
            value={newPerformanceScore}
            color={getPerformanceColor(newPerformanceScore)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerformanceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdatePerformance} variant="contained">
            Update Score
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ NEW: Toggle Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>
          {selectedClub?.isActive ? 'Deactivate' : 'Activate'} Club
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to {selectedClub?.isActive ? 'deactivate' : 'activate'} 
            {' '}{selectedClub?.name}?
          </Typography>
          <Alert severity={selectedClub?.isActive ? 'warning' : 'info'} sx={{ mt: 2 }}>
            {selectedClub?.isActive 
              ? 'Deactivating will make the club inactive. Members cannot create events under this club.'
              : 'Activating will allow the club to create events and be visible to students.'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleToggleStatus} 
            variant="contained" 
            color={selectedClub?.isActive ? 'error' : 'success'}
          >
            {selectedClub?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Club</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedClub?.name}?
            This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will also remove the club from any assigned president's profile.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteClub} variant="contained" color="error">
            Delete Club
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClubManagement; 