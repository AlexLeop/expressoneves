@@ .. @@
 import React, { useState } from 'react';
 import { AppProvider, useApp } from './context/AppContext';
+import { Toaster } from 'react-hot-toast';
 import { 
   PDR, 
   Dashboard, 
@@ .. @@
 }
 
 function MainApp() {
-  const { data } = useApp();
+  const { data, loading } = useApp();
   const [activeTab, setActiveTab] = useState('dashboard');
   const [currentUser, setCurrentUser] = useState(null);
   const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
@@ .. @@
     setCurrentUser(null);
   };
 
+  if (loading) {
+    return (
+      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
+        <div className="text-center">
+          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
+          <p className="text-gray-600">Carregando sistema...</p>
+        </div>
+      </div>
+    );
+  }
+
   if (!currentUser) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
@@ .. @@
 export default function App() {
   return (
     <AppProvider>
+      <Toaster 
+        position="top-right"
+        toastOptions={{
+          duration: 4000,
+          style: {
+            background: '#363636',
+            color: '#fff',
+          },
+          success: {
+            duration: 3000,
+            theme: {
+              primary: '#4aed88',
+            },
+          },
+        }}
+      />
       <MainApp />
     </AppProvider>
   );