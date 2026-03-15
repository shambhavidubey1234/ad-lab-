import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../services/api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await getProfile();
      
      if (response.data.success) {
        console.log("📥 Fresh data from API:", response.data.user);
        setProfile(response.data.user);
        
        // Force update localStorage AND state
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        
        console.log("✅ Profile updated with:", {
          collegeId: response.data.user.collegeId,
          department: response.data.user.department,
          year: response.data.user.year
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Force refresh on page load
  useEffect(() => {
    const handlePageLoad = () => {
      if (user._id) {
        console.log("🔄 Page loaded, current user:", {
          name: user.name,
          collegeId: user.collegeId,
          department: user.department,
          year: user.year
        });
      }
    };
    handlePageLoad();
  }, [user]);

  if (loading) {
    return (
      <div style={{ 
        padding: "40px", 
        textAlign: "center",
        color: "#DBA858"
      }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "0 auto", 
      padding: "2rem"
    }}>
      <h1 style={{ 
        color: "#DBA858", 
        borderBottom: "2px solid #8C0E0F",
        paddingBottom: "0.5rem",
        marginBottom: "1.5rem"
      }}>
        👤 Your Profile
      </h1>
      
      <div style={{ 
        background: "linear-gradient(135deg, #0B2838 0%, #083248 100%)",
        padding: "2rem", 
        borderRadius: "8px",
        border: "1px solid #8C0E0F",
        marginTop: "1rem"
      }}>
        {/* User Info Section */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #083248"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            background: "#E89C31",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            color: "#031B28",
            marginRight: "1.5rem"
          }}>
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h2 style={{ color: "#E89C31", marginBottom: "0.3rem" }}>
              {user.name || "User"}
            </h2>
            <p style={{ color: "#DBA858", marginBottom: "0.5rem" }}>
              {user.email || "No email"}
            </p>
            <div style={{
              display: "inline-block",
              background: user.role === 'club_admin' ? "#8C0E0F" : "#083248",
              color: "#DBA858",
              padding: "0.3rem 0.8rem",
              borderRadius: "20px",
              fontSize: "0.8rem",
              fontWeight: "bold"
            }}>
              {user.role || "student"}
            </div>
          </div>
        </div>
        
        {/* Profile Details */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#E89C31", marginBottom: "1rem" }}>
            Profile Details
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem"
          }}>
            <div style={{ padding: "1rem", background: "rgba(3, 27, 40, 0.3)", borderRadius: "6px" }}>
              <div style={{ color: "#A0AEC0", fontSize: "0.9rem", marginBottom: "0.3rem" }}>Phone</div>
              <div style={{ color: "#DBA858", fontSize: "1.1rem", fontWeight: "bold" }}>
                {user.phone || "Not set"}
              </div>
            </div>
            
            <div style={{ padding: "1rem", background: "rgba(3, 27, 40, 0.3)", borderRadius: "6px" }}>
              <div style={{ color: "#A0AEC0", fontSize: "0.9rem", marginBottom: "0.3rem" }}>College ID</div>
              <div style={{ color: "#E89C31", fontSize: "1.1rem", fontWeight: "bold" }}>
                {user.collegeId || "Not set"}
              </div>
            </div>
            
            <div style={{ padding: "1rem", background: "rgba(3, 27, 40, 0.3)", borderRadius: "6px" }}>
              <div style={{ color: "#A0AEC0", fontSize: "0.9rem", marginBottom: "0.3rem" }}>Department</div>
              <div style={{ color: "#E89C31", fontSize: "1.1rem", fontWeight: "bold" }}>
                {user.department || "Not set"}
              </div>
            </div>
            
            <div style={{ padding: "1rem", background: "rgba(3, 27, 40, 0.3)", borderRadius: "6px" }}>
              <div style={{ color: "#A0AEC0", fontSize: "0.9rem", marginBottom: "0.3rem" }}>Year</div>
              <div style={{ color: "#E89C31", fontSize: "1.1rem", fontWeight: "bold" }}>
                {user.year ? `Year ${user.year}` : "Not set"}
              </div>
            </div>
          </div>
          
          {/* Bio Section */}
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ color: "#A0AEC0", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Bio</div>
            <div style={{ 
              padding: "1rem", 
              background: "rgba(3, 27, 40, 0.3)", 
              borderRadius: "6px",
              color: "#DBA858",
              minHeight: "60px"
            }}>
              {user.bio || "No bio added yet. Tell us about yourself!"}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #083248", 
          paddingTop: "1.5rem"
        }}>
          <div style={{ display: "flex", gap: "0.8rem" }}>
            <button 
              onClick={loadProfile}
              style={{ 
                padding: "0.6rem 1.2rem", 
                background: "rgba(40, 167, 69, 0.2)", 
                color: "#d4edda", 
                border: "1px solid #28a745",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(40, 167, 69, 0.3)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(40, 167, 69, 0.2)"}
            >
              🔄 Refresh Profile
            </button>
            
            <button 
              onClick={() => {
                console.log("Current user data:", user);
                alert(`👤 Name: ${user.name}\n🏫 College ID: ${user.collegeId}\n📚 Department: ${user.department}\n📅 Year: ${user.year}\n📞 Phone: ${user.phone || "Not set"}\n🎭 Role: ${user.role}`);
              }}
              style={{ 
                padding: "0.6rem 1.2rem", 
                background: "rgba(108, 117, 125, 0.2)", 
                color: "#DBA858", 
                border: "1px solid #6c757d",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.background = "rgba(108, 117, 125, 0.3)"}
              onMouseLeave={(e) => e.target.style.background = "rgba(108, 117, 125, 0.2)"}
            >
              🔍 View Data
            </button>
          </div>
          
          <Link 
            to="/profile/edit"
            style={{
              padding: "0.7rem 1.5rem",
              background: "linear-gradient(135deg, #E89C31 0%, #DBA858 100%)",
              color: "#031B28",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "all 0.2s",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
            }}
          >
            ✏️ Edit Profile
          </Link>
        </div>
      </div>

      {/* Status Footer */}
      <div style={{ 
        marginTop: "2rem", 
        padding: "1rem",
        background: "rgba(140, 14, 15, 0.1)",
        borderRadius: "6px",
        border: "1px solid #8C0E0F",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#A0AEC0"
      }}>
        <p>✅ Profile data loaded successfully!</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: "#E89C31" }}>
          College ID: <strong>{user.collegeId}</strong> • 
          Department: <strong>{user.department}</strong> • 
          Year: <strong>{user.year}</strong>
        </p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>
          Click <strong>Edit Profile</strong> to update phone & bio
        </p>
        <p style={{ fontSize: "0.7rem", marginTop: "0.5rem", color: "#A0AEC0" }}>
          API: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/users/profile
        </p>
      </div>
    </div>
  );
}

export default Profile;