const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const config = require('./config');

const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(path.join(dbDir, 'nav.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_menus_order ON menus("order")`);
  
  // 添加子菜单表
  db.run(`CREATE TABLE IF NOT EXISTS sub_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    FOREIGN KEY(parent_id) REFERENCES menus(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sub_menus_parent_id ON sub_menus(parent_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sub_menus_order ON sub_menus("order")`);
  
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER,
    sub_menu_id INTEGER,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    custom_logo_path TEXT,
    desc TEXT,
    "order" INTEGER DEFAULT 0,
    FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY(sub_menu_id) REFERENCES sub_menus(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cards_menu_id ON cards(menu_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cards_sub_menu_id ON cards(sub_menu_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cards_order ON cards("order")`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    position TEXT NOT NULL, -- left/right
    img TEXT NOT NULL,
    url TEXT NOT NULL
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position)`);
  db.run(`CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT
  )`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_friends_title ON friends(title)`);

  // 检查菜单表是否为空，若为空则插入默认菜单
  db.get('SELECT COUNT(*) as count FROM menus', (err, row) => {
    if (row && row.count === 0) {
      const defaultMenus = [
        ['Home', 1],
        ['Cused', 2], 
        ['Cloud', 3],
        ['Soft', 4],
        ['Tools', 5],
        ['Other', 6]
      ];
      const stmt = db.prepare('INSERT INTO menus (name, "order") VALUES (?, ?)');
      defaultMenus.forEach(([name, order]) => stmt.run(name, order));
      stmt.finalize(() => {
        // 确保菜单插入完成后再插入子菜单和卡片
        console.log('菜单插入完成，开始插入默认子菜单和卡片...');
        insertDefaultSubMenusAndCards();
      });
    }
  });

  // 插入默认子菜单和卡片的函数
  function insertDefaultSubMenusAndCards() {
    db.all('SELECT * FROM menus ORDER BY "order"', (err, menus) => {
      if (err) {
        console.error('获取菜单失败:', err);
        return;
      }
      
      if (menus && menus.length) {
        console.log('找到菜单数量:', menus.length);
        menus.forEach(menu => {
          console.log(`菜单: ${menu.name} (ID: ${menu.id})`);
        });
        
        const menuMap = {};
        menus.forEach(m => { menuMap[m.name] = m.id; });
        console.log('菜单映射:', menuMap);
        
        // 插入子菜单
        const subMenus = [
          // Cused (来自上次修改)
          { parentMenu: 'Cused', name: 'forum', order: 1 },
          { parentMenu: 'Cused', name: 'domain', order: 2 },
          { parentMenu: 'Cused', name: 'mail', order: 3 },
          // Other (你的新需求)
          { parentMenu: 'Other', name: 'AI chat', order: 1 },
          { parentMenu: 'Other', name: 'Platform', order: 2 },
          // (其他子菜单保持不变)
          { parentMenu: 'Tools', name: 'Dev Tools', order: 1 },
          { parentMenu: 'Soft', name: 'Mac', order: 1 },
          { parentMenu: 'Soft', name: 'iOS', order: 2 },
          { parentMenu: 'Soft', name: 'Android', order: 3 },
          { parentMenu: 'Soft', name: 'Windows', order: 4 }
        ];
        
        const subMenuStmt = db.prepare('INSERT INTO sub_menus (parent_id, name, "order") VALUES (?, ?, ?)');
        let subMenuInsertCount = 0;
        const subMenuMap = {};
        
        subMenus.forEach(subMenu => {
          if (menuMap[subMenu.parentMenu]) {
            subMenuStmt.run(menuMap[subMenu.parentMenu], subMenu.name, subMenu.order, function(err) {
              if (err) {
                console.error(`插入子菜单失败 [${subMenu.parentMenu}] ${subMenu.name}:`, err);
              } else {
                subMenuInsertCount++;
                // 保存子菜单ID映射，用于后续插入卡片
                subMenuMap[`${subMenu.parentMenu}_${subMenu.name}`] = this.lastID;
                console.log(`成功插入子菜单 [${subMenu.parentMenu}] ${subMenu.name} (ID: ${this.lastID})`);
              }
            });
          } else {
            console.warn(`未找到父菜单: ${subMenu.parentMenu}`);
          }
        });
        
        subMenuStmt.finalize(() => {
          console.log(`所有子菜单插入完成，总计: ${subMenuInsertCount} 个子菜单`);
          
          // 插入卡片（包括主菜单卡片和子菜单卡片）
          const cards = [
            // Home
            { menu: 'Home', title: 'Nav', url: 'https://nav.hxjx.hidns.co/', logo_url: 'https://nav.hxjx.hidns.co/logo.svg', desc: '个人导航站'  },
            { menu: 'Home', title: 'Youtube', url: 'https://www.youtube.com', logo_url: 'https://img.icons8.com/ios-filled/100/ff1d06/youtube-play.png', desc: '全球最大的视频社区'  },
            { menu: 'Home', title: 'google cloud', url: 'https://cloud.google.com/?hl=zh-cn', logo_url: '', desc: ''  },
            { menu: 'Home', title: 'GitHub', url: 'https://github.com', logo_url: '', desc: '全球最大的代码托管平台'  },
            { menu: 'Home', title: 'ip.sb', url: 'https://ip.sb', logo_url: '', desc: 'ip地址查询'  },
            { menu: 'Home', title: 'Cloudflare', url: 'https://dash.cloudflare.com', logo_url: '', desc: '全球最大的cdn服务商'  },
            { menu: 'Home', title: 'komari', url: 'https://km.363689.xyz', logo_url: '', desc: 'komari面板监控'  }, 
            { menu: 'Home', title: 'komari', url: 'https://km.hxjx.hidns.co', logo_url: 'https://nav.hxjx.hidns.co/icon/komari.svg', desc: 'komari面板监控'  },
            { menu: 'Home', title: 'nezha', url: 'https://mb.hxjx.hidns.co', logo_url: 'https://nav.hxjx.hidns.co//icon/nezha2.png', desc: 'nezha面板监控'  },
            { menu: 'Home', title: 'nezha', url: 'https://nzha.netlib.re', logo_url: 'https://nav.hxjx.hidns.co//icon/nezha.png', desc: 'nezha面板监控'  },
            { menu: 'Home', title: 'nezha', url: 'https://nz.363689.xyz', logo_url: 'https://nav.hxjx.hidns.co/icon/nz.svg', desc: 'nezha面板监控'  },
            { menu: 'Home', title: '服务到期监控', url: 'https://sak.wwr.qzz.io', logo_url: 'https://nav.hxjx.hidns.co/icon/jk.svg', desc: '服务器到期监控提醒'  },
            { menu: 'Home', title: '域名到期管理', url: 'https://dak.wwr.qzz.io', logo_url: 'https://nav.hxjx.hidns.co/icon/jk.svg', desc: '域名到期管理提醒'  },
            { menu: 'Home', title: 'blog-hexo', url: 'https://blog.hxjx.hidns.co', logo_url: 'https://nav.hxjx.hidns.co/icon/hexo.svg', desc: 'hexo博客'  },
            { menu: 'Home', title: 'blog-typecho', url: 'https://to.363689.xyz', logo_url: 'https://nav.hxjx.hidns.co/icon/blog.svg', desc: 'typecho博客'  },
            { menu: 'Home', title: 'blog-typecho', url: 'https://blog.hxjx.hidns.vip', logo_url: 'https://nav.hxjx.hidns.co/icon/blog.svg', desc: 'typecho博客'  },
            { menu: 'Home', title: 'blog-next', url: 'https://blog.363689.xyz', logo_url: 'https://nav.hxjx.hidns.co/icon/next.png', desc: 'next博客'  },
            { menu: 'Home', title: 'img', url: 'https://img.hxjx.hidns.co', logo_url: 'https://nav.hxjx.hidns.co/icon/img.png', desc: '图床'  },
            { menu: 'Home', title: 'sub', url: 'https://sub.ab12.dpdns.org/admin', logo_url: 'https://nav.hxjx.hidns.co/icon/sub.png', desc: '订阅提醒'  },
            { menu: 'Home', title: 'openlist', url: 'hhttps://openlist.363689.xyz', logo_url: 'https://nav.hxjx.hidns.co/icon/oplist.svg', desc: 'openlist服务'  },
            { menu: 'Home', title: 'oplist', url: 'https://oplist.hxjx.hidns.co', logo_url: 'https://nav.hxjx.hidns.co/icon/oplist.svg', desc: 'openlist服务'  },
            { menu: 'Home', title: 'alist', url: 'https://alist.alistv.netlib.re', logo_url: 'https://nav.hxjx.hidns.co/icon/alist.svg', desc: 'alist服务'  },
            { menu: 'Home', title: 'TXT', url: 'https://txt.wwp.qzz.io/xxsky', logo_url: 'https://nav.hxjx.hidns.co/icon/txt.svg', desc: '在线文本'  },
            { menu: 'Home', title: 'TXT', url: 'https://txt.wwo.qzz.io/xxsky', logo_url: 'https://nav.hxjx.hidns.co/icon/txt.svg', desc: '在线文本'  },
            { menu: 'Home', title: 'ssh-v4', url: 'https://ssh.363689.xyz', logo_url: 'https://nav.hxjx.hidns.co/icon/ssh.png', desc: 'ipv4的在线ssh'  },
            { menu: 'Home', title: 'TV', url: 'https://tv.363689.xyz', logo_url: 'https://nav.hxjx.hidns.co/icon/tv.png', desc: 'moontv'  },
            { menu: 'Home', title: '订阅转换', url: 'https://sub.363689.xyz/xu', logo_url: 'https://nav.hxjx.hidns.co/icon/sub.svg', desc: '节点订阅转换'  },
            { menu: 'Home', title: '订阅转换', url: 'https://sub.hxjx.qzz.io/xu', logo_url: 'https://nav.hxjx.hidns.co/icon/sub.svg', desc: '节点订阅转换'  },
            // Cused -> forum (保留你的自定义数据)
            { subMenu: 'forum', title: 'NodeSeek', url: 'https://www.nodeseek.com', logo_url: 'https://www.nodeseek.com/static/image/favicon/favicon-32x32.png', desc: '主机论坛' },
            { subMenu: 'forum', title: 'Linux do', url: 'https://linux.do', logo_url: 'https://linux.do/uploads/default/optimized/3X/9/d/9dd49731091ce8656e94433a26a3ef36062b3994_2_32x32.png', desc: '新的理想型社区' },
            { subMenu: 'forum', title: 'mjjbox', url: 'https://mjjbox.com', logo_url: 'https://mjjbox.com/uploads/default/optimized/1X/9968c7be9b329bbd201860bf8aede029a2521934_2_32x32.png', desc: 'mjj论坛' },
            { subMenu: 'forum', title: 'mjjvm', url: 'https://www.mjjvm.com', logo_url: '', desc: 'mjjvm后台' },
            { subMenu: 'forum', title: 'netjett', url: 'https://netjett.com', logo_url: '', desc: 'netjett论坛' },
            { subMenu: 'forum', title: 'runfreecloud', url: 'https://run.freecloud.ltd', logo_url: '', desc: 'runfreecloud签到' },
            { subMenu: 'forum', title: 'leaflow', url: 'https://leaflow.net', logo_url: '', desc: 'leaflow容器' },
                
            // Cused -> domain (保留你的自定义数据)
            { subMenu: 'domain', title: '域名检查', url: 'https://who.cx', logo_url: '', desc: '域名可用性查询' },
            { subMenu: 'domain', title: '域名比价', url: 'https://www.whois.com', logo_url: '', desc: '域名价格比较' },
            { subMenu: 'domain', title: 'netlib.re', url: 'https://www.netlib.re', logo_url: '', desc: '免费域名' },
            { subMenu: 'domain', title: 'hidoha', url: 'https://www.hidoha.net', logo_url: '', desc: '免费域名' },
            { subMenu: 'domain', title: 'zoneabc', url: 'https://zoneabc.net', logo_url: '', desc: '免费域名' },
            { subMenu: 'domain', title: 'dnshe', url: 'https://my.dnshe.com/index.php', logo_url: '', desc: '免费域名' },
            { subMenu: 'domain', title: 'digitalplat', url: 'https://digitalplat.org', logo_url: '', desc: '免费域名' },
            { subMenu: 'domain', title: 'aibo', url: 'https://domain.aiboculture.com', logo_url: '', desc: '免费域名' },                
            // Cused -> mail (保留你的自定义数据)
            { subMenu: 'mail', title: 'Gmail', url: 'https://mail.google.com', logo_url: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico', desc: 'Google邮箱' },
            { subMenu: 'mail', title: 'Outlook', url: 'https://outlook.live.com', logo_url: 'https://img.icons8.com/color/256/ms-outlook.png', desc: '微软Outlook邮箱' },
            { subMenu: 'mail', title: 'Proton Mail', url: 'https://account.proton.me', logo_url: 'https://account.proton.me/assets/apple-touch-icon-120x120.png', desc: '安全加密邮箱' },
            { subMenu: 'mail', title: 'QQ邮箱', url: 'https://mail.qq.com', logo_url: 'https://mail.qq.com/zh_CN/htmledition/images/favicon/qqmail_favicon_96h.png', desc: '腾讯QQ邮箱' },
            { subMenu: 'mail', title: '雅虎邮箱', url: 'https://mail.yahoo.com', logo_url: 'https://img.icons8.com/color/240/yahoo--v2.png', desc: '雅虎邮箱' },
            { subMenu: 'mail', title: '10分钟临时邮箱', url: 'https://linshiyouxiang.net', logo_url: 'https://linshiyouxiang.net/static/index/zh/images/favicon.ico', desc: '10分钟临时邮箱' },
            { subMenu: 'mail', title: 'cm.edu.kg', url: 'https://mail.cm.edu.kg', logo_url: '', desc: '教育域名邮箱' },
            { subMenu: 'mail', title: 'cnmb.win', url: 'https://cnmb.wint', logo_url: '', desc: '域名邮箱' },                

            // Other -> AI chat (你的新需求)
            { subMenu: 'AI chat', title: 'ChatGPT', url: 'https://chat.openai.com', logo_url: 'https://cdn.oaistatic.com/assets/favicon-eex17e9e.ico', desc: 'OpenAI官方AI对话' },
            { subMenu: 'AI chat', title: 'Deepseek', url: 'https://www.deepseek.com', logo_url: 'https://cdn.deepseek.com/chat/icon.png', desc: 'Deepseek AI搜索' },
            { subMenu: 'AI chat', title: 'Claude', url: 'https://claude.ai', logo_url: 'https://img.icons8.com/fluency/240/claude-ai.png', desc: 'Anthropic Claude AI' },
            { subMenu: 'AI chat', title: 'Google Gemini', url: 'https://gemini.google.com', logo_url: 'https://www.gstatic.com/lamda/images/gemini_sparkle_aurora_33f86dc0c0257da337c63.svg', desc: 'Google Gemini大模型' },
            { subMenu: 'AI chat', title: '阿里千问', url: 'https://chat.qwenlm.ai', logo_url: 'https://g.alicdn.com/qwenweb/qwen-ai-fe/0.0.11/favicon.ico', desc: '阿里云千问大模型' },
            { subMenu: 'AI chat', title: 'Kimi', url: 'https://www.kimi.com', logo_url: '', desc: '月之暗面Moonshot AI' },
            
            // Other -> Platform (你的新需求, 原 'Home' 卡片)
            { subMenu: 'Platform', title: 'ChatGPT', url: 'https://chat.openai.com', logo_url: 'https://cdn.oaistatic.com/assets/favicon-eex17e9e.ico', desc: '人工智能AI聊天机器人'  },
            { subMenu: 'Platform', title: 'Huggingface', url: 'https://huggingface.co', logo_url: '', desc: '全球最大的开源模型托管平台'  },
            { subMenu: 'Platform', title: 'ITDOG', url: 'https://www.itdog.cn/tcping', logo_url: '', desc: '在线tcping'  },
            { subMenu: 'Platform', title: 'Ping0', url: 'https://ping0.cc', logo_url: '', desc: 'ip地址查询'  },
            { subMenu: 'Platform', title: '浏览器指纹', url: 'https://www.browserscan.net/zh', logo_url: '', desc: '浏览器指纹查询'  },
            { subMenu: 'Platform', title: 'nezha面板', url: 'https://ssss.nyc.mn', logo_url: 'https://nezha.wiki/logo.png', desc: 'nezha面板'  },
            { subMenu: 'Platform', title: 'Api测试', url: 'https://hoppscotch.io', logo_url: '', desc: '在线api测试工具'  },
            { subMenu: 'Platform', title: '在线音乐', url: 'https://music.eooce.com', logo_url: 'https://p3.music.126.net/tBTNafgjNnTL1KlZMt7lVA==/18885211718935735.jpg', desc: '在线音乐' },
            { subMenu: 'Platform', title: '在线电影', url: 'https://libretv.eooce.com', logo_url: 'https://img.icons8.com/color/240/cinema---v1.png', desc: '在线电影'  },
            { subMenu: 'Platform', title: '免费接码', url: 'https://www.smsonline.cloud/zh', logo_url: '', desc: '免费接收短信验证码' },
            { subMenu: 'Platform', title: '订阅转换', url: 'https://sublink.eooce.com', logo_url: 'https://img.icons8.com/color/96/link--v1.png', desc: '最好用的订阅转换工具' },
            { subMenu: 'Platform', title: 'webssh', url: 'https://ssh.eooce.com', logo_url: 'https://img.icons8.com/fluency/240/ssh.png', desc: '最好用的webssh终端管理工具' },
            { subMenu: 'Platform', title: '文件快递柜', url: 'https://filebox.nnuu.nyc.mn', logo_url: 'https://img.icons8.com/nolan/256/document.png', desc: '文件输出分享' },
            { subMenu: 'Platform', title: '真实地址生成', url: 'https://address.nnuu.nyc.mn', logo_url: 'https://static11.meiguodizhi.com/favicon.ico', desc: '基于当前ip生成真实的地址' },

            // Cloud (保持不变)
            { menu: 'Cloud', title: '阿里云', url: 'https://www.aliyun.com', logo_url: 'https://img.alicdn.com/tfs/TB1_ZXuNcfpK1RjSZFOXXa6nFXa-32-32.ico', desc: '阿里云官网' },
            { menu: 'Cloud', title: '腾讯云', url: 'https://cloud.tencent.com', logo_url: '', desc: '腾讯云官网' },
            { menu: 'Cloud', title: '甲骨文云', url: 'https://cloud.oracle.com', logo_url: '', desc: 'Oracle Cloud' },
            { menu: 'Cloud', title: '亚马逊云', url: 'https://aws.amazon.com', logo_url: 'https://img.icons8.com/color/144/amazon-web-services.png', desc: 'Amazon AWS' },
            { menu: 'Cloud', title: 'DigitalOcean', url: 'https://www.digitalocean.com', logo_url: 'https://www.digitalocean.com/_next/static/media/apple-touch-icon.d7edaa01.png', desc: 'DigitalOcean VPS' },
            { menu: 'Cloud', title: 'Vultr', url: 'https://www.vultr.com', logo_url: '', desc: 'Vultr VPS' },
            // Soft (保持不变)
            { menu: 'Soft', title: 'Hellowindows', url: 'https://hellowindows.cn', logo_url: 'https://hellowindows.cn/logo-s.png', desc: 'windows系统及office下载' },
            { menu: 'Soft', title: '奇迹秀', url: 'https://www.qijishow.com/down', logo_url: 'https://www.qijishow.com/img/ico.ico', desc: '设计师的百宝箱' },
            { menu: 'Soft', title: '易破解', url: 'https://www.ypojie.com', logo_url: 'https://www.ypojie.com/favicon.ico', desc: '精品windows软件' },
            { menu: 'Soft', title: '软件先锋', url: 'https://topcracked.com', logo_url: 'https://cdn.mac89.com/win_macxf_node/static/favicon.ico', desc: '精品windows软件' },
            { menu: 'Soft', title: 'Macwk', url: 'https://www.macwk.com', logo_url: 'https://www.macwk.com/favicon-32x32.ico', desc: '精品Mac软件' },
            { menu: 'Soft', title: 'Macsc', url: 'https://mac.macsc.com', logo_url: 'https://cdn.mac89.com/macsc_node/static/favicon.ico', desc: '' },
            // Tools (保持不变)
            { menu: 'Tools', title: 'JSON工具', url: 'https://www.json.cn', logo_url: 'https://img.icons8.com/nolan/128/json.png', desc: 'JSON格式化/校验' },
            { menu: 'Tools', title: 'base64工具', url: 'https://www.qqxiuzi.cn/bianma/base64.htm', logo_url: 'https://cdn.base64decode.org/assets/images/b64-180.webp', desc: '在线base64编码解码' },
            { menu: 'Tools', title: '二维码生成', url: 'https://cli.im', logo_url: 'https://img.icons8.com/fluency/96/qr-code.png', desc: '二维码生成工具' },
            { menu: 'Tools', title: 'JS混淆', url: 'https://obfuscator.io', logo_url: 'https://img.icons8.com/color/240/javascript--v1.png', desc: '在线Javascript代码混淆' },
            { menu: 'Tools', title: 'Python混淆', url: 'https://freecodingtools.org/tools/obfuscator/python', logo_url: 'https://img.icons8.com/color/240/python--v1.png', desc: '在线python代码混淆' },
            { menu: 'Tools', title: 'Remove.photos', url: 'https://remove.photos/zh-cn', logo_url: 'https://img.icons8.com/doodle/192/picture.png', desc: '一键抠图' },
            { menu: 'Tools', title: 'favicon', url: 'https://tool.lu/favicon', logo_url: '', desc: 'favicon图标生成' },
            { menu: 'Tools', title: 'Coolors', url: 'https://ailongmiao.com/coolors-co', logo_url: '', desc: '在线配色' },               
            // Tools - Dev Tools 子菜单卡片 (保持不变)
            { subMenu: 'Dev Tools', title: 'Uiverse', url: 'https://uiverse.io/elements', logo_url: 'https://img.icons8.com/fluency/96/web-design.png', desc: 'CSS动画和设计元素' },
            { subMenu: 'Dev Tools', title: 'Icons8', url: 'https://igoutu.cn/icons', logo_url: 'https://maxst.icons8.com/vue-static/landings/primary-landings/favs/icons8_fav_32×32.png', desc: '免费图标和设计资源' }
          ];
          
          const cardStmt = db.prepare('INSERT INTO cards (menu_id, sub_menu_id, title, url, logo_url, desc) VALUES (?, ?, ?, ?, ?, ?)');
          let cardInsertCount = 0;
          
          cards.forEach(card => {
            if (card.subMenu) {
              // 插入子菜单卡片
              // 查找对应的子菜单ID，需要遍历所有可能的父菜单
              let subMenuId = null;
              for (const [key, id] of Object.entries(subMenuMap)) {
                if (key.endsWith(`_${card.subMenu}`)) {
                  subMenuId = id;
                  break;
                }
              }
              
              if (subMenuId) {
                cardStmt.run(null, subMenuId, card.title, card.url, card.logo_url, card.desc, function(err) {
                  if (err) {
                    console.error(`插入子菜单卡片失败 [${card.subMenu}] ${card.title}:`, err);
                  } else {
                    cardInsertCount++;
                    console.log(`成功插入子菜单卡片 [${card.subMenu}] ${card.title}`);
                  }
                });
              } else {
                console.warn(`未找到子菜单: ${card.subMenu}`);
              }
            } else if (menuMap[card.menu]) {
              // 插入主菜单卡片
              cardStmt.run(menuMap[card.menu], null, card.title, card.url, card.logo_url, card.desc, function(err) {
                if (err) {
                  console.error(`插入卡片失败 [${card.menu}] ${card.title}:`, err);
                } else {
                  cardInsertCount++;
                  console.log(`成功插入卡片 [${card.menu}] ${card.title}`);
                }
              });
            } else {
              console.warn(`未找到菜单: ${card.menu}`);
            }
          });
          
          cardStmt.finalize(() => {
            console.log(`所有卡片插入完成，总计: ${cardInsertCount} 张卡片`);
          });
        });
      } else {
        console.log('未找到任何菜单');
      }
    });
  }

  // 插入默认管理员账号
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (row && row.count === 0) {
      const passwordHash = bcrypt.hashSync(config.admin.password, 10);
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [config.admin.username, passwordHash]);
    }
  });

  // 插入默认友情链接
  db.get('SELECT COUNT(*) as count FROM friends', (err, row) => {
    if (row && row.count === 0) {
      const defaultFriends = [
        ['Noodseek图床', 'https://www.nodeimage.com', 'https://www.nodeseek.com/static/image/favicon/favicon-32x32.png'],
        ['Font Awesome', 'https://fontawesome.com', 'https://fontawesome.com/favicon.ico']
      ];
      const stmt = db.prepare('INSERT INTO friends (title, url, logo) VALUES (?, ?, ?)');
      defaultFriends.forEach(([title, url, logo]) => stmt.run(title, url, logo));
      stmt.finalize();
    }
  });

  db.run(`ALTER TABLE users ADD COLUMN last_login_time TEXT`, [], () => {});
  db.run(`ALTER TABLE users ADD COLUMN last_login_ip TEXT`, [], () => {});
});


module.exports = db; 




