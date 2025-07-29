# Admin Portal Testing Guide

## 🧪 How to Test the Admin Portal

### Step 1: Start the Development Server
```bash
cd frontend
npm run dev
```

### Step 2: Access the Admin Portal
1. Open your browser and go to `http://localhost:5173/admin`
2. Or click the "🔧 Admin" button on the main dashboard

### Step 3: Sign In with Demo Credentials
- **Email**: `admin@hacksky.com`
- **Password**: `admin123`
- Click "Sign In"

### Step 4: Verify the Admin Panel Loads
You should see:
- ✅ Admin Control Panel header
- ✅ Three plant sections (Water, Nuclear, Grid)
- ✅ System controls for each plant
- ✅ Emergency shutdown buttons
- ✅ Individual component toggles

### Step 5: Test Functionality
1. **Toggle Individual Controls**: Click the switches next to components
2. **Emergency Shutdown**: Click "🚨 Emergency Shutdown" for any plant
3. **Activate All Systems**: Click "⚡ Activate All Systems" to restore
4. **System Status Overview**: Check the bottom section for status percentages

### Step 6: Test Navigation
- Click "Dashboard" to return to main page
- Click "Sign Out" to end the session

## 🔍 Debugging Console

Open browser developer tools (F12) and check the console for:
- Authentication logs
- System controls loading logs
- Any error messages

## 🚨 Expected Console Output

When signing in with demo credentials, you should see:
```
Attempting to sign in with: admin@hacksky.com
Demo authentication successful
User or isAdmin changed: {user: "demo-user-id", isAdmin: true}
Fetching system controls for user: demo-user-id
Fetching system controls for user: demo-user-id
Creating demo system controls
Setting demo controls: 23 controls
```

## ⚠️ Common Issues & Solutions

### Issue: "Sign in failed" error
**Solution**: Make sure you're using exactly:
- Email: `admin@hacksky.com`
- Password: `admin123`

### Issue: Admin panel doesn't load after sign in
**Solution**: 
1. Check browser console for errors
2. Make sure you're using the correct credentials
3. Try refreshing the page

### Issue: System controls not showing
**Solution**:
1. Check if demo controls are being created (console log)
2. Verify the user state is set correctly
3. Check if isAdmin is set to true

### Issue: Page not redirecting properly
**Solution**:
1. Check if React Router is working
2. Verify the App.tsx routing is correct
3. Try navigating directly to `/admin`

## 🎯 Success Criteria

The admin portal is working correctly if:
- ✅ You can sign in with demo credentials
- ✅ The admin panel loads with all three plants
- ✅ You can toggle individual system controls
- ✅ Emergency shutdown and activation work
- ✅ System status overview shows correct percentages
- ✅ Navigation between dashboard and admin works
- ✅ Sign out returns you to the login screen

## 📞 If Issues Persist

1. Check the browser console for error messages
2. Verify all files are saved and the build is successful
3. Try clearing browser cache and cookies
4. Restart the development server 