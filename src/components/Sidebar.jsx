import React from 'react';
import { Database, Settings as SettingsIcon, Users, BookOpen, Menu } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed }) => {
  const menuItems = [
    { id: 'data-management', label: '데이터 관리', icon: Database },
    { id: 'student-group-view', label: '학생별 확인', icon: Users },
    { id: 'subject-group-view', label: '과목별 확인', icon: BookOpen },
    { id: 'settings', label: '점검 규칙 설정', icon: SettingsIcon },
  ];

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="sidebar-brand-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span className="sidebar-logo">📝</span>
          <span className="sidebar-title">생기부 점검기</span>
        </div>
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="btn-icon" 
          title="메뉴 접기/펼치기" 
          style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Menu style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(item.id)}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>생활기록부 점검 v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
