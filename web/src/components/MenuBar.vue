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
      
      <svg 
        class="theme-icon" 
        :style="{ display: theme === 'light' ? 'block' : 'none' }"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      >
        <path d="M12 2.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 2.25zM7.5 4.06c.26 0 .52.1.72.29l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 01.29-.72.75.75 0 01.75-.29zm10.94 2.19c.26 0 .52.1.72.29l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 011.06-1.06.75.75 0 01.29.72zM4.06 7.5c0-.26.1-.52.29-.72l1.06-1.06a.75.75 0 011.06 1.06L5.12 7.78a.75.75 0 01-.72.29.75.75 0 01-.75-.75.75.75 0 01.29-.72zM21.75 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM4.5 12a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm7.5 7.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm-3.44-2.19a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06.72.29zM18.94 16.5a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06zM12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
      </svg>
      
      <svg 
        class="theme-icon" 
        :style="{ display: theme === 'dark-milky' ? 'block' : 'none' }"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      >
        <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 004.463-.69a.75.75 0 01.981.98 10.503 10.503 0 01-5.455 2.593 10.5 10.5 0 01-11.66-11.66 10.503 10.503 0 012.593-5.455.75.75 0 01.819.162z" clip-rule="evenodd" />
      </svg>
      
      <svg 
        class="theme-icon" 
        :style="{ display: theme === 'dark-smoky' ? 'block' : 'none' }"
        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      >
        <path fill-rule="evenodd" d="M12 21a9 9 0 100-18 9 9 0 000 18z" clip-rule="evenodd" />
      </svg>
    </button>
  </nav>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useStorage } from '@vueuse/core';

// (Script 逻辑保持不变, 它是正确的)
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
// 这个 watchEffect 仍然是必需的, 它用来控制
// theme.css 里的所有样式 (卡片, 蒙版等)
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

/* *** 这是正确的按钮样式 *** */
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
}
.theme-toggle-button:hover {
  background-color: var(--card-bg);
  color: var(--text-color);
  transform: none;
}
.theme-toggle-button::before {
  display: none;
}

/* *** 这是正确的 SVG 样式 *** */
.theme-icon {
  width: 24px;   
  height: 24px;
  fill: var(--text-color); /* 强制使用 CSS 变量填充颜色 */
  pointer-events: none;    /* 让点击穿透图标, 点击到按钮上 */
}

/* *** 我把所有错误的 CSS 切换逻辑都删除了 *** */
/* *** (这里不再需要任何 html.dark-milky 规则) *** */


@media (max-width: 768px) {
  /* (响应式样式保持不变) */
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

  .theme-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
