<template>
    <div class="home">
      <h1>GitHub Repository Manager</h1>
      <nav class="navigation">
        <router-link 
          :to="{ name: 'FullRepositories', query: { page: 1 }}" 
          class="nav-link"
        >
          Full Repositories
        </router-link>
        <router-link 
          :to="{ name: 'Search' }" 
          class="nav-link"
        >
          Search
        </router-link>
      </nav>
    </div>
  </template>
  
  <style scoped>
  .home {
    padding: 20px;
    text-align: center;
  }
  
  .navigation {
    margin: 20px 0;
  }
  
  .nav-link {
    margin: 0 10px;
    padding: 8px 16px;
    text-decoration: none;
    color: #2c3e50;
    border: 1px solid #2c3e50;
    border-radius: 4px;
  }
  
  .nav-link:hover {
    background-color: #2c3e50;
    color: white;
  }
  </style>