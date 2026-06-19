import type { AuditLog } from '@/types';
import { maskVin } from '@/utils/masking';

interface AuditOpMapping {
  menu: string;
  function: string;
  contentTpl: string;
}

const AUDIT_OP_MAPPINGS: AuditOpMapping[] = [
  { menu: '账户', function: '登录', contentTpl: '登录系统' },
  { menu: '账户', function: '退出', contentTpl: '退出系统' },
  { menu: '账户', function: '修改密码', contentTpl: '修改密码' },
  { menu: '账户', function: '重置密码', contentTpl: '重置用户 maria.g@stgo-transport.cl 的密码' },
  { menu: '业务管理', function: '新增租户层级', contentTpl: '新增租户层级【南区运营中心】' },
  { menu: '业务管理', function: '编辑租户层级', contentTpl: '编辑租户层级【南区运营中心】为【南区运营总部】' },
  { menu: '业务管理', function: '删除租户层级', contentTpl: '删除租户层级【临时测试层级】' },
  { menu: '业务管理', function: '配置功能权限', contentTpl: '配置【南区运营中心】的功能权限' },
  { menu: '业务管理', function: '同步资产', contentTpl: '执行资产同步' },
  { menu: '业务管理', function: '资产划拨', contentTpl: `将车辆 ${maskVin('LJ8T7AD0000100001')} 从 苇渡根租户 划拨至 Santiago Transport` },
  { menu: '业务管理', function: '批量资产划拨', contentTpl: '批量资产划拨：将 12 辆车划拨至 智利物流集团' },
  { menu: '业务管理', function: '删除资产', contentTpl: `删除资产 ${maskVin('LJ8T7AD0000100003')}` },
  { menu: '业务管理', function: '新增用户', contentTpl: '新增用户 new_operator@wd-logistics.cl，分配角色 Operator' },
  { menu: '业务管理', function: '编辑用户', contentTpl: '编辑用户 maria.g@stgo-transport.cl 信息' },
  { menu: '业务管理', function: '删除用户', contentTpl: '删除用户 temp_user@test.cl' },
  { menu: '业务管理', function: '重置密码', contentTpl: '重置用户 maria.g@stgo-transport.cl 的密码' },
  { menu: '业务管理', function: '新增角色', contentTpl: '新增角色 Dispatcher' },
  { menu: '业务管理', function: '编辑角色', contentTpl: '编辑角色 Operator' },
  { menu: '业务管理', function: '删除角色', contentTpl: '删除角色 TempRole' },
  { menu: '业务管理', function: '编辑功能权限', contentTpl: '编辑角色 Operator 的功能权限' },
  { menu: '租户管理', function: '新增租户', contentTpl: '新增租户【Rancagua Fleet Services】' },
  { menu: '租户管理', function: '编辑租户', contentTpl: '编辑租户【智利物流集团】信息' },
  { menu: '租户管理', function: '删除租户', contentTpl: '删除租户【Test Tenant】' },
  { menu: '租户管理', function: '开通主账号', contentTpl: '为租户【智利物流集团】开通主账号 admin@wd-logistics.cl' },
  { menu: '车辆管理', function: '批量导入', contentTpl: '批量导入车辆信息：成功 24 条，失败 2 条' },
  { menu: '围栏管理', function: '新建围栏', contentTpl: '新建围栏【圣地亚哥主干道围栏】，类型【中心围栏】，预警【出栏预警】' },
  { menu: '围栏管理', function: '编辑围栏', contentTpl: '编辑围栏【Valparaiso Port Area】' },
  { menu: '围栏管理', function: '删除围栏', contentTpl: '删除围栏【Test Geofence】' },
  { menu: '围栏管理', function: '启用围栏', contentTpl: '启用围栏【Maipu Logistics Park】' },
  { menu: '围栏管理', function: '停用围栏', contentTpl: '停用围栏【Maipu Logistics Park】' },
  { menu: '围栏管理', function: '添加车辆', contentTpl: `为围栏【圣地亚哥中心仓库】添加车辆 ${maskVin('LJ8T7AD0000100005')}` },
  { menu: '围栏管理', function: '删除车辆', contentTpl: `从围栏【圣地亚哥中心仓库】移除车辆 ${maskVin('LJ8T7AD0000100006')}` },
  { menu: '风控预警', function: '一键报修（故障类）', contentTpl: `一键报修（故障类）：车辆 ${maskVin('LJ8T7AD0000100003')}，报警类型 VDC故障` },
  { menu: '风控预警', function: '一键报修（电池类）', contentTpl: `一键报修（电池类）：车辆 ${maskVin('LJ8T7AD0000100005')}，报警类型 SOC过低` },
  { menu: '维修管理', function: '新建维修', contentTpl: `新建维修记录：车辆 ${maskVin('LJ8T7AD0000100001')}，类型 故障类` },
  { menu: '维修管理', function: '完成维修', contentTpl: `标记维修完成：车辆 ${maskVin('LJ8T7AD0000100001')}，类型 故障类` },
  { menu: '维修管理', function: '删除维修', contentTpl: `删除维修记录：车辆 ${maskVin('LJ8T7AD0000100003')}，类型 电池类` },
  { menu: '系统管理', function: '新增用户', contentTpl: '新增用户 sys_operator@weidu.cl，分配角色 System Admin' },
  { menu: '系统管理', function: '编辑用户', contentTpl: '编辑用户 sysop1@weidu.cl 信息' },
  { menu: '系统管理', function: '删除用户', contentTpl: '删除用户 temp_sys@weidu.cl' },
  { menu: '系统管理', function: '重置密码', contentTpl: '重置用户 sysop1@weidu.cl 的密码' },
  { menu: '系统管理', function: '新增角色', contentTpl: '新增角色 System Auditor' },
  { menu: '系统管理', function: '编辑角色', contentTpl: '编辑角色 System Admin' },
  { menu: '系统管理', function: '删除角色', contentTpl: '删除角色 Temp Sys Role' },
  { menu: '系统管理', function: '编辑功能权限', contentTpl: '编辑角色 System Admin 的功能权限' },
  { menu: '车辆数据', function: '导出车辆信号数据', contentTpl: `导出车辆 ${maskVin('LJ8T7AD0000100001')} 信号数据` },
  { menu: '车辆数据', function: '下载导出文件', contentTpl: '下载导出文件 vehicle_signal_20260601.csv' },
];

const auditNicknames = ['root_admin', 'carlos_admin', 'maria_op', 'juan_mon', 'ana_disp', 'pedro_op', 'sys_op1', 'auditor'];
const auditAccounts = ['root@weidu.cl', 'carlos.gomez@wd-logistics.cl', 'maria.g@stgo-transport.cl', 'juan.perez@vap-log.cl', 'ana.m@rf-svc.cl', 'pedro.s@qt.cl', 'sysop1@weidu.cl', 'auditor@weidu.cl'];
const auditTenants = ['苇渡根租户', '智利物流集团', 'Santiago Transport', 'Valparaiso Logistics', 'Rancagua Fleet Services', 'Quillota Transporte'];

const auditLogData: AuditLog[] = Array.from({ length: 40 }, (_, i) => {
  const mapping = AUDIT_OP_MAPPINGS[i % AUDIT_OP_MAPPINGS.length]!;
  const nickIdx = i % auditNicknames.length;
  const nickname = auditNicknames[nickIdx] as string;
  const isFail = i % 5 === 0;
  const daysAgo = Math.floor(i * 4.5);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + (i % 12), (i * 7) % 60, (i * 3) % 60);
  return {
    id: `al-${i + 1}`,
    time: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`,
    nickname,
    account: auditAccounts[nickIdx] as string,
    tenant: auditTenants[i % auditTenants.length] as string,
    menu: mapping.menu,
    function: mapping.function,
    content: mapping.contentTpl,
    result: isFail ? 'fail' : 'success',
    ...(isFail ? { failReason: ['ERR_AUTH_DENIED', 'ERR_NETWORK', 'ERR_PARAM_INVALID', 'ERR_NOT_FOUND'][i % 4] } : {}),
  };
});

export function getAuditLogs(): AuditLog[] {
  return auditLogData;
}
