<template>
  <nav class="menu-bar">
    <div 
      v-for="menu in menus" 
      :key="menu.id" 
      class="menu-item"
      @mouseenter="showSubMenu(menu.id)"
      @mouseleave="hideSubMenu(menu.id)"
    >
      <button 
        @click="$emit('select', menu)" 
        :class="{active: menu.id === activeId}"
      >
        {{ menu.name }}
      </button>
      
      <div 
        v-if="menu.subMenus && menu.subMenus.length > 0" 
        class="sub-menu"
        :class="{ 'show': hoveredMenuId === menu.id }"
      >
        <button 
          v-for="subMenu in menu.subMenus" 
          :key="subMenu.id"
          @click="$emit('select', subMenu, menu)"
          :class="{active: subMenu.id === activeSubMenuId}"
          class="sub-menu-item"
        >
          {{ subMenu.name }}
        </button>
      </div>
    </div>

    <button @click="cycleTheme()" class="theme-toggle-button" title="切换显示模式">
      <span v-if="theme === 'light'">☀️</span>     <span v-if="theme === 'dark-milky'">🌙</span> <span v-if="theme === 'dark-smoky'">🌑</span> </button>
  </nav>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useStorage } from '@vueuse/core';

// (Script 逻辑是 100% 正确的)
const props = defineProps({ 
  menus: Array, 
  activeId: Number,
  activeSubMenuId: Number 
});
const hoveredMenuId = ref(null);
const theme = useStorage('my-nav-theme-preference', 'light');
function cycleTheme() {
  if (theme.value === 'light') {
    theme.value = 'dark-milky';
  } else if (theme.value === 'dark-milky') {
    theme.value = 'dark-smoky';
  } else {
    theme.value = 'light';
  }
}
watchEffect(() => {
  const html = document.documentElement;
  html.classList.remove('dark-milky', 'dark-smoky');
  if (theme.value === 'dark-milky') {
    html.classList.add('dark-milky');
  } else if (theme.value === 'dark-smoky') {
    html.classList.add('dark-smoky');
  }
});
function showSubMenu(menuId) {
  hoveredMenuId.value = menuId;
}
function hideSubMenu(menuId) {
  setTimeout(() => {
    if (hoveredMenuId.value === menuId) {
      hoveredMenuId.value = null;
    }
  }, 100);
}
</script>

<style scoped>
/* (所有旧的菜单样式保持不变) */
.menu-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 1rem;
  position: relative;
}
.menu-item {
  position: relative;
}
.menu-bar button {
  background: transparent;
  border: none;
  color: var(--menu-text-color);
  font-size: 16px;
  font-weight: 500;
  padding: 0.8rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: var(--menu-text-shadow);
  box-shadow: none;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}
.menu-bar button::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--menu-active-color);
  transition: all 0.3s ease;
  transform: translateX(-50%);
}
.menu-bar button:hover {
  color: var(--menu-active-color);
  transform: translateY(-1px);
}
.menu-bar button.active {
  color: var(--menu-active-color);
}
.menu-bar button.active::before {
  width: 60%;
}
.sub-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--submenu-bg);
  backdrop-filter: blur(8px);
  border-radius: 6px;
  min-width: 120px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: var(--submenu-shadow);
  border: 1px solid var(--submenu-border);
  margin-top: -2px; 
}
.sub-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(2px);
}
.sub-menu-item {
  display: block !important;
  width: 100% !important;
  text-align: center !important;
  padding: 0.4rem 1rem !important;
  border: none !important;
  background: transparent !important;
  color: var(--menu-text-color) !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-radius: 0 !important;
  text-shadow: none !important;
  line-height: 1.5 !important;
}
.sub-menu-item:hover {
  background: var(--submenu-hover-bg) !important;
  color: var(--menu-active-color) !important;
  transform: none !important;
}
.sub-menu-item.active {
  background: var(--submenu-active-bg) !important;
  color: var(--menu-active-color) !important;
  font-weight: 500 !important;
}
.sub-menu-item::before {
  display: none;
}

/* *** 这是我唯一的修改 *** */
.theme-toggle-button {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1rem;
  padding: 0;
  
  /* *** 把这一行加进去 *** 它会强制把彩色的 Emoji 变成灰度 (黑白)
  */
  filter: grayscale(100%);
}
.theme-toggle-button:hover {
  background-color: var(--card-bg);
  color: var(--text-color);
  transform: none;
}
.theme-toggle-button::before {
  display: none;
}


@media (max-width: 768px) {
  .menu-bar {
    gap: 0.2rem;
  }
  
  .menu-bar button {
    font-size: 14px;
    padding: .4rem .8rem;
  }
  
  .sub-menu {
    min-width: 100px;
  }
  
  .sub-menu-item {
    font-size: 8px !important;
    padding: 0.2rem 0.8rem !important;
  }

  .theme-toggle-button {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    margin-left: 0.5rem;
  }
}
</style>
