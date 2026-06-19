# 智利车队管理PRD

|版本号|修改内容|撰写人|日期|备注|
|---|---|---|---|---|
|v1\.0|初稿|罗荣|2026\-05\-18|\(后期修改内容可在此备注新修改的字体颜色或备注撰写位置\)|
||||||

### UI设计稿链接：

# 项目综述

## 背景

在此描述,请开始你们的表演\.\.\.

## 目标

在此描述\.\.\.

## 功能结构图

无

## 产品架构



## 

# 全局逻辑

|功能名称|功能逻辑|
|---|---|
|时间|- 全局涉及的时间，都将时间戳转换为智利时区<br>    - 冬令时：UTC\-4<br>        - 冬令时定义：每年 4 月第一个星期六的 24:00 开始，至 9 月第一个星期六的 24:00 结束。<br>    - 夏令时：UTC\-3<br>        - 夏令时定义：每年 9 月第一个星期六的 24:00 开始，至 次年 4 月第一个星期六的 24:00 结束。|
|VIN码脱敏<br>|- 脱敏规则：对17位车辆VIN码进行去标识化处理。固定保留前6位和后4位，中间7位字符使用星号\*替换。格式示例：LSG4AA\*\*\*\*\*\*\*5678<br>- 覆盖范围：全局所有涉及VIN码的前端显示界面（包含但不限于车辆列表、车辆详情、资产列表、地图气泡窗、各类报表及弹窗、日志审计列表等）<br>- 查询支持：检索输入时支持用户输入完整的明文VIN码，也支持输入脱敏后的可见字符进行模糊匹配，后台执行精确或模糊查询后，返回脱敏展示的数据。<br>- 异常与边界情况处理：仅限前端界面显示脱敏。数据导出文件（如Excel）和数据导入文件必须使用明文|
|车牌号脱敏|- 脱敏规则：统一采用首尾各保留2位，中间使用星号\*替换的策略<br>- 无分隔符格式示例：车牌 ABCD12，脱敏显示为 AB\*\*12<br>- 覆盖范围：全局所有涉及车牌号的前端展示界面、排行榜、地图气泡等<br>- 查询支持：模糊检索时支持输入完整明文或部分可见字符。<br>- 异常与边界情况处理：<br>    - 若车牌号长度 ≤ 4位，则不脱敏<br>    - 若长度 ≥5 位，保留首尾各2位，中间不论几位均替换为 \*（例如：ABCDE 替换为 AB\*DE）|
|地理位置显示精度调整|- 精度限制规则：全局凡是涉及经纬度逆地址解析显示的位置字段，解析与显示精度最高仅保留至街道/路口级别<br>- 覆盖范围：列表的地址信息、地图中的地址信息|
|检索匹配规则|- 检索输入时，支持用户输入完整的明文，也支持输入脱敏后的可见字符进行模糊匹配<br>- 后台数据库统一存储明文<br>- 查询时，后台对明文执行精确或模糊查询，查询结果返回给前端时，前端再执行脱敏渲染|

# 功能详情

## 登录及基础能力（基线）

### 功能描述：

1. 对接用户中心，提供登录能力

2. 提供修改密码、语言切换、租户切换能力

### 使用场景：

在此描述

### 功能流程：

在此上图

### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NzMyMjUyY2ZlODNhMjRiNTRlOWQ0N2YwMjFmYTk3N2NfMjg4OGJmN2Y0NjgzNjY4YzMyNjMwM2NjNzc3MDdkZDlfSUQ6NzY0NjMwNTMzNTUwMjcwMzgzM18xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MjlmZWJkZjllNzBkZTY0MzE5ODc1YjhiZDg4MTY4YmNfZTA0NDM1YzA5YWRkOTczODUxOTE1NWE0ZjQzZDhjYmJfSUQ6NzY0NjMwNTQ2ODY0MzUyNzg3MF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

### 功能逻辑

|一级功能名称|二级功能名称|功能逻辑|交互说明|
|---|---|---|---|
|项目应用登录|/|- 调用公共登录接口||
|修改密码|/|- 场景1：创建的新用户或重置过密码的用户，未修改过密码，登录到系统时。<br>    - 用户每次登录到系统后，自动弹出修改密码弹窗。<br>    - 用户已修改过密码，不再弹出。<br>- 场景2：用户主动修改密码，用户点击系统右上角用户昵称下拉，点击修改密码操作。<br>    - 点击后，弹出修改密码弹窗。<br>- 用户修改密码<br>    - 当前密码：输入系统当前登录用户的密码<br>    - 新密码：输入8\~18位字符，支持数字、英文、特殊字符<br>    - 确认新密码：输入密码与新密码保持一致，不一致时，输入框失焦时飘红提示，与输入的新密码不一致。<br>    - 点击确定，调用服务端校验当前密码是否正确，校验通过后用户中心服务端修改密码。点击取消关闭弹窗。||
|语言切换|/|- 支持中文、英文系统语言切换<br>- 默认英文||
|租户切换|/|- 数据说明：根据当前登录用户，本应用内各租户建立的关系，展示各租户的信息，无层级展示，仅平铺。取用户与租户建立的关联关系时间展示，最新建立的在最下面展示。<br>- 如果当前用户仅关联一个租户，则切换按钮隐藏不展示。<br>- 如果当前租户关联多个租户，展示切换按钮，点击后展示可切换的租户名称列表。<br>- 记录当前用户最近一次切换选择的租户，用户无切换操作时，用户退出登录，均默认选中最近一次选中租户信息。如果最近一次切换的租户已到期，则默认选中下一个未到期的租户。<br>- 选中租户后，登录用户的左侧菜单，根据登录用户在该租户下归属的角色权限展示。<br>- 若登录账户关联下的租户归属的一级租户服务到期，则该一级租户及二三级租户显示服务过期。<br>![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MTY0YTY1ZmIzYzU3YmRjMDY2YzJmNTY1YWQ3MDdmMjZfZTFiNDAyMzNhYjkxMDQ2YWY4MzE0ZjliMGFkM2NjMGFfSUQ6NzY0NjMwODUxNTEzMjUwOTExNl8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)||

### 登录/修改密码异常提示

|**功能**|**场景**|**异常提示文案**|
|---|---|---|
|登录页|用户输入的账号、密码不匹配|账号密码错误|
||用户输入的账号不存在|账号密码错误|
||用户输入验证码不正确|验证码错误|
||用户输入的账号、密码、验证码均错误|账号密码错误|
|修改密码|用户输入错误的当前密码|当前密码错误|
||用户输入新密码不符合长度及格式要求|请输入输入8\~18位字符，支持数字、英文、特殊字符|
||用户输入的新密码与当前密码一致|新密码不能与当前密码相同|
||用户输入的确认新密码与新密码不一致|新密码不一致|

## 首页看板（定制）

### 功能描述：

在此描述

### 使用场景：

在此描述

### 功能流程：

在此上图

### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZjhmN2JhNGQyM2MxYjQxOGRiODJjMDY4ZmRhYjI2M2VfOTU0ODZhMTcxMmYzYTgwY2QwMjJkM2UwNWExOTQ4YzRfSUQ6NzY0OTY5MDM5NDU2NzM5NjUzMF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|数据指标|- 车辆总数：平台所有车辆总数<br>- 在线数：OBD设备在线数<br>- 离线数：OBD设备离线数<br>- 今日里程：所有车辆今日里程总数<br>- 累计总里程：所有车辆历史里程总数<br>- 今日驾驶预警：所有车辆今日触发的驾驶预警总数<br>- 今日围栏预警：所有车辆今日触发的围栏预警总数<br>- 今日低电报警：所有车辆今日触发的电池报警且类型为“SOC过低”的总数||
|数据图表|- 驾驶风险分布<br>    - 图表形式：柱状图<br>    - 数据来源：急加速、急减速、急转弯、疲劳驾驶、AEB制动事件<br>    - 计算方式：每类事件数量的占比<br>    - 筛选项：今日、近7日、近30日<br>        - 默认选择今日<br>        - 选择后动态展示今日/近7日/近30日驾驶风险的预警数||
|实时位置地图|- 地图的方式展出所有车辆的实时位置信息、车辆信息、电池信息、行驶速度。地图自动缩放大小至可以展示所有车辆<br>- 地图需支持拖拽，支持放大缩小||
|今日预警排行榜|- 列表数据来源：今日触发了驾驶预警、围栏预警、故障预警、低电量报警的车辆<br>- 列表字段<br>    - 排名序号<br>    - 车牌号<br>    - 驾驶预警：今日触发次数<br>    - 围栏预警：今日触发次数<br>    - 故障预警：今日触发次数<br>    - 低电报警：今日触发次数<br>    - 总计：这4类预警/报警的总数<br>- 排序：按排名正序排列||

## 业务管理（基线）

### 租户权限

#### 功能描述：

使用多层级的租户管理，对一级租户赋予相应的功能权限。对一级租户下的二级及以下的层级定义每级的功能权限范围。

#### 租户层级及权限定义：

#### 页面原型

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MWY0MDQxZWQ3MWJkNjdlNTZlYTIyOGRjZjFhYTc2MWJfNzFkZWRlZjIzNzcyMDljOTViMzhmYmRhYjZjMzFhYzZfSUQ6NzY0NjMxOTA5NjQ2OTE0NjU3NF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|租户层级|- 租户层级展示说明<br>    - 根级租户：苇渡汽车<br>    - 一级租户（定义本级租户权限），数据来源为苇渡根级租户下创建的一级租户的所有信息<br>    - 二级及下级（定义二级及以下租户同级的权限模板），由应用管理员创建配置，用于批量快速定义二级及以下租户的权限<br>- 租户层级增删改查<br>    - 根级租户，数据初始化，应用搭建时，默认初始化。<br>    - 一级租户，数据来源，从根级租户的租户管理获取，展示根据租户所有的下级租户的名称信息。<br>        - 一级租户不支持编辑，删除，统一由租户管理模块管理。<br>        - 一级租户，可添加下级租户，仅可添加一个。添加后，添加下级入口隐藏。<br>    - 二级，数据来源，在本页面由一级添加<br>        - 二级，支持编辑，编辑名称。<br>        - 支持删除，如果存在下级时，不可删除，点击后给出相关提示。如果并不存在下级时，点击删除，显示二次确认弹窗，点击后删除。<br>        - 支持新增下级，新增下级，填写新增下级的名称。<br>    - 二级及以下逻辑，同二级。二级及以下，仅可添加一级。<br>![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NzlmMjkxMTQwNjhmZmMzN2NiYTFkNzIzZjIyZjgzZGRfYzQ3Y2U3NWNiNjdjMTk2N2I2NzcyNmY5NmMyYTI0M2NfSUQ6NzY0NjMyNDc3NjY5MjQ1MjUzMV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)<br>||
|租户功能权限|- 功能权限配置说明<br>    - 根级租户苇渡，默认功能权限由应用产品定义，不可配置修改。<br>    - 一级租户，在租户维度配置，可选功能权限为本应用的全部功能权限。<br>    - 二级及以下，在租户层级维度配置，可选功能为本应用的全部功能权限。||

### 租户信息

#### 页面原型

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=N2VkYjFjMzcxZWY1MWJiODBiY2I1ZThkOGFhMWFkZWFfNDEyNzIxOGNmZDQ4ZDRiNmRhMDQ0M2E2Y2E0Y2NkYTdfSUQ6NzY0NjMxOTA5NjEyNTEzMTcwN18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|租户树信息|1、查询，输入关键词模糊查询租户名称信息，页面根据关键词，模糊匹配符合条件的查询项，并展示。<br>2、租户树信息：按树级结构展示逐级的租户信息。<br>1）根级租户，由应用产品经理初始化定义。<br>2）下级租户，根据对应级下创建的租户信息展示，展示租户名称。<br>2、租户详情<br>除根级租户外，下级的每级租户可点击，点击后查询租户的基础信息和管理员展示信息。<br>3、该页面仅面向应用管理员开放（根级租户管理员）|用户ID删除|

### 资产划拨

#### 数据关系

#### 页面原型

资产划拨

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MzFjMTZjNGQwMzI3Yjg0YzlkYTNhMDYxYWI0YTcxYzRfZDBjZjFkNDMwMGU1OTliNmI2Y2MyZjBlODgxNGZhMzhfSUQ6NzY0NjMxOTA5NzU1MDk5ODc0M18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

划拨记录

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MGEyNTQ1YTExZGVlZTdhNTk2OTc0OWNkMjczZmEyNjZfODIxNGIwMjdhMzgxYTM3ZTVkMjljNWNiMjIzOWJmZDVfSUQ6NzY0NjMxOTA5OTYzMDcxODE0M18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：资产列表展示|1、数据来源：点击同步数据按钮，由应用从IOT平台按照指定渠道标识同步落库。<br>2、数据范围：展示该应用下所有的车辆资产数据。<br>3、列表展示字段<br>1）序号：默认按行，从1\~10，根据每页展示的条数展示。<br>2）VIN码根据同步数据展示，归属租户，刚同步未进行资产划拨的为空不展示，已划拨归属租户的，按指定租户信息展示。<br>3）同步时间：应用首次同步资产创建入库的时间。<br>4）操作列：资产划拨、划拨记录、删除。<br>2、列表默认展示顺序，创建时间倒序，最近创建的数据最前面展示。默认每页10条。<br>3、分页条数：10、20、50、100条每页。|筛选项归属租户改成多选<br>|
|2：资产信息查询|1、查询条件<br>1）VIN码：精准查询，输入框支持文本输入，长度不限。<br>2）归属租户：租户树的信息级联展示，支持选择至每个层级。新增“未划拨”选择，选择未划拨时，查询未划拨归属租户的资产数据。未选择，为空时，查询全部的数据。<br>3）同步时间：日期区间选择组件，无默认日期区间展示，由用户选择。<br>2、点击查询，调用服务端车辆列表查询能力，列表渲染同时满足多项查询条件的车辆信息。<br>3、点击重置，清空已选择的查询条件，列表按默认条件渲染数据。||
|3：同步数据|1、首次同步，点击后，根据该应用下配置的渠道标识，查询IOT平台的VIN码数据，并落库到应用下的车辆表中。<br>2、后续同步，根据渠道标识获取的车辆信息，以VIN码为唯一标识，匹配已落库的数据，对增量数据做入库。||
|4：批量资产划拨|1、勾选指定资产数据行，点击批量资产划拨弹窗。未勾选指定资产数据行，点击后，toast提示：请选择指定数据操作。<br>2、批量资产划拨弹窗，显示归属租户，选择指定指定层级的租户树信息，点击确定，保存资产归属的租户信息。<br>3、租户树无层级限制，可选择所有层级内的租户信息。<br>4、如果资产已划拨租户，批量资产划拨时，将之前的租户信息更新为批量资产划拨时选择的租户信息。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MmFlNzE3N2FmNWYyYzZmYjQ4MDVmNmE1MGEzYzhlNGRfNTJlMzMxODZlZjVlZTFlODNlOTY3MGVhNzY3ZmQ3NzlfSUQ6NzY0NjMxOTA5OTA2NDY4MzQ4NF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)<br>|
|5：资产划拨|1、点击车辆资产划拨按钮，弹出车辆资产划拨弹窗<br>2、弹窗内容展示<br>1）VIN码，仅展示不可调整。<br>3）归属租户：已划拨的资产，回显已划拨的租户信息，未划拨的资产展示请选择归属数据。<br>3、点击确定，调用服务端更新车辆归属租户信息。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YjU5Y2Y1NDFlYzVjYzExZDY1NDIxYWZiZGY4OTQzODdfYzVkMmM0YjRiZmYyMDczOGU1MDEyZGZlZDM4YTlmMDdfSUQ6NzY0NjMxOTA5OTc5OTg5OTM0MF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)|
|6：划拨记录|1、点击划拨记录按钮，进入划拨记录详情。展示该资产归属租户的变更记录。<br>2、划拨记录<br>1）展示该资产归属租户的划拨信息，包含划拨时间，变更人，划拨前租户，划拨后租户。<br>2）按划拨时间倒序展示，最新创建的在最前面展示。<br>3）归属租户信息更新，即产生一条记录。||
|7：删除|1、点击删除，根据VIN查询该VIN是否已关联设备信息，已关联设备，弹出该资产已关联设备，不可删除的弹窗提示。<br>2、未关联设备的资产，点击后，弹出二次确认弹窗，确认删除该资产信息。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZjQxZTJhYTMwYWRjNmNlYWEyM2UzNThhNGEzN2IzMjlfOGQzYmJjN2FhYTAyYzkxOWZjZTcwN2ViYjExY2M3ZjVfSUQ6NzY0NjMxOTA5OTA2NDc4MTc4OF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)|

### 用户管理

#### 页面原型

用户管理

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MjNlZWVjNDg1N2U2ZWE3M2RlZWFjNzZhZDI3ZTJlYmVfMWQxMjMxNjU5MTI4ZTZjMzQyOGEwZDBkNDU4OTgxZjhfSUQ6NzY0NjMxOTA5ODM4OTQ2NjMxN18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)



新增用户

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MTQ3ZDdmNjRkZDMwNmY4MjdhYWIzMWNlMmIyODA2MGRfMmVjZjFiMjc3M2RhMjI3OWEwNmViNTI0OGIwZTFiZWRfSUQ6NzY0NjMxOTA5OTk0MDg4MzY0NF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NTlmMzE1MzU2NzRmODllYzYyMGM4MTQ3NTUyNWNjZjRfMTk5NGQxMWQxYmNkMDJiMWFkNDI2NWJjNjQ4NzdhYjNfSUQ6NzY0NjMxOTA5NjQ2OTM5MjMzNF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YmQzY2UwNTFhNDZmM2ZiMmU3OGM0N2VlYTBlYmFhZGNfYjFiODA3MjZlZmU5MDk1YmIzMmJjOWQ5OTFkOGQ2NDNfSUQ6NzY0NjMxOTA5OTQ4ODI5MjAyNV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)



#### 功能逻辑

用户管理

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：租户树信息|1、查询，输入关键词模糊查询租户名称信息，页面根据关键词，模糊匹配符合条件的查询项，并展示。<br>2、租户树信息：按树级结构展示逐级的租户信息。<br>3、页面默认选中根级租户。||
|2：新增用户|1、点击新增用户按钮，页面跳转至新增用户页面。||
|3：用户列表展示|1、根据左侧选中的租户信息，查询该租户下创建的用户信息。<br>2、列表展示字段<br>1）序号：默认按行，从1\~10，根据每页展示的条数展示。<br>2）用户昵称、登录邮箱、角色，根据用户内容展示。角色存在多个时用、号分开展示。<br>3）创建时间：展示用户信息创建入库的时间。<br>4）操作列：重置密码、编辑、删除<br>2、列表默认展示顺序，创建时间倒序，最近创建的最前面展示。默认每页10条。<br>3、分页条数：10、20、50、100条每页。||
|4：重置密码|1、点击重置密码，弹出二次确认弹窗，点击确认后，关闭该弹窗，调用服务端将该账号密码重置。<br>2、并弹出已重置密码的信息弹窗，展示用户昵称、登录邮箱、新密码信息。<br>1）新密码规则同账号创建初始密码规则，大写字母和数字组成8为随机字符。<br>3、复制信息：点击后，将登录邮箱，新密码复制到系统粘贴板上，并toast提示：复制成功<br>4、点击关闭，关闭弹窗。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NmFkODc3NjA5YzIwNzBhNWJiMTU4ZWRlNzNmNGZhNjRfZjgzNWM4YjJmZGIxZTJmMmMyNmU1MjU3ODI5NTIxNGNfSUQ6NzY0NjMxOTA5NjUzNjAyNjMyMV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)<br>|
|5：编辑用户|1、点击编辑用户，弹出编辑用户弹窗。<br>2、回显当前用户信息，用户昵称、登录邮箱、角色信息。<br>3、用户信息更改后，点击确定，校验登录邮箱是否已被其他用户使用，如果已使用，输入框下飘红提示。如果未使用调用服务端保存用户信息。<br>4、该级租户下某用户为管理员角色，则角色信息置灰不可更改。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YmNjNGE1YzEyNjQwYmE1OTZhNjlhOWMxMGUwYTM4Y2FfOWI2MDIxOGI2ODIwZTUzZDBiODE2ZDRiY2M5ZDUwM2ZfSUQ6NzY0NjMxOTA5OTk5OTk0NzczN18xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)<br>|
|6：删除用户|1、点击删除用户按钮，弹出删除用户二次确认弹窗，点击确定，调用服务端删除用户，仅删除该用户在该租户下的对应角色权hao限关系。如果该用户同时存在该应用下其他租户用户，其他租户下的用户不影响。<br>2、该级租户下管理员角色的账号不可删除。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ODUwN2JlMjlhN2E5YjYxNTA5ODg1NDhmYmVhYjdiYzFfNGUyMWEzZjgwOTU5YjQyOTIwOGFkNjllN2ZhMTM4NWRfSUQ6NzY0NjMxOTA5Nzg5ODg0NzQ0Ml8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)<br>|
|7：查询用户|1、查询条件<br>1）用户昵称：模糊查询，输入框支持输入文本，长度不限制。<br>2）登录邮箱：模糊查询，输入框支持文本输入，长度不限。<br>3）角色：多选下拉框，支持模糊查询，数据来源，已选租户下创建的角色数据。<br>4）创建时间：日期区间选择组件，无默认日期区间展示，由用户选择。<br>2、点击查询，调用服务端查询用户列表，列表渲染同时满足多项查询条件的用户信息。<br>3、点击重置，清空已选择的查询条件，列表按默认条件渲染数据。||

新增用户

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：创建账号（第一步）|1、创建账号<br>1）用户昵称：支持文本输入，长度20个字符，必填，不做唯一性校验，可重复。<br>2）登录邮箱：支持输入英文、数字、特殊字符，必填，做常规邮箱格式校验，不符合邮箱格式，输入框下飘红是提示，请输入正确格式的邮箱。<br>3）角色：多选下拉框支持模糊查询，必选，数据来源，对应租户下创建的角色数据。<br>3、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户，根据不同情况进入第二步。<br>4、点击返回，返回到用户管理列表页。||
|1：创建账号（第二步，账号不存在）|1、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户。<br>2、当前用户中心不存在该邮箱创建的用户时，以登录邮箱为唯一表示，在用户中心创建用户，并建立应用下对应租户下数据的关联关系。<br>1）用户ID：根据系统ID生成规则生成<br>2）登录邮箱：为用户第一步创建时填写的邮箱信息。<br>3）初始密码：使用大写英文字母和数字，生产8位的随机字符。<br>并赋予该用户到该租户下已选角色的相关权限。<br>3、复制信息：点击后，将登录邮箱，初始密码复制到系统粘贴板上，并toast提示：复制成功<br>4、点击完成：页面调整至用户列表。||
|1：创建账号（第二步，账号已存在）|1、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户。<br>2、当前用户中心已存在该邮箱创建的用户时，页面展示已存在的用户信息，展示用户ID、登录邮箱、用户昵称<br>3、复制信息：点击后，将登录邮箱、用户昵称复制到系统粘贴板上，并toast提示：复制成功<br>4、使用该账号创建，在当前用户角色的基础上，添加第一步已选对应租户下角色信息，已存在的不做添加。<br>5、点击上一步，返回到第一步，点击完成，页面调整至用户列表。||

### 角色管理

#### 页面原型

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MGIyZTY2NjY0MzY0YWQzODUwMTkyYmE2NjBlODIyZDRfY2U4ZmQ0NDdkODhhZWEwNzI5MGM4ZjcwMDgxNjMxNjRfSUQ6NzY0NjMxOTEwMTI2NjIzNDMxN18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：租户树信息|同用户管理页面逻辑|数据权限删除|
|2：角色列表展示|1、根据左侧选中的租户信息，查询该租户下创建的角色信息。<br>2、角色信息按创建时间正序展示，最新创建的在最下方展示。<br>3、管理员：上级租户创建本季租户，开通管理员账号时，系统自动在该租户的角色管理中创建管理员角色。功能权限为租户层级中对应的租户权限信息，数据权限默认为全部下级租户。<br>1）该管理员角色不支持编辑，删除，修改功能权限和数据权限。<br>4、鼠标移入角色，显示编辑、删除图标。点击角色右侧展示该角色的功能权限和数据权限信息。||
|3：新增角色|1、点击新增角色按钮，在下方展示新增角色输入框，角色名称，支持输入文本，长度10个字符，与该租户下已存在的角色做唯一性校验，点击对号，保存角色，角色名称重复，输入框下飘红提示，角色已存在。<br>2、权限配置<br>1）点击右侧功能权限，编辑，进入编辑状态，功能权限范围，为该租户层级下可配置的权限范围。<br>2）数据权限，默认全部下级租户。||
|4：删除角色|点击删除角色，弹出二次确认弹窗：<br>如果该角色未关联用户，二次确认弹窗，提示：删除后数据无法恢复，是否继续？<br>如果该角色已被用户关联使用，二次确认弹窗，提示：该角色已关联用户，删除后用户无相关权限，是否继续？<br>点击确认调用服务端执行角色删除，点击取消，关闭该弹窗。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTE3MDBmZjM5MDk3Zjg3N2Y1ZjNlZWVkMTYyMWVmMDZfMDQxZThjZjZlOTgxNjdmZmVlNDdkNDU2MTJiODE1NmNfSUQ6NzY0NjMxOTA5ODU4Mjc4MDg3MV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)|

## 租户管理（基线）

### 页面原型

租户管理

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ODA2Njg1MDVhMjMxYzI4NWQ0NGNjNDQ3ODI2Mzc2M2JfOGZkMjcxNThjZGNiODAwYTRiNjlhOGYxNDU1MTYzYjdfSUQ6NzY0NjMyOTM3OTU4MDU5NTE3NF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

开通账户

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MmJjZjlkMGYyZWRlMDUwODBmMjc1NjRhMzA3OTkxM2ZfMTVlYmY2ODk5NDI2M2U3NjQ1MzNiMDEyYmQwNTFhODJfSUQ6NzY0NjMyOTM3NzQ3NTI2NzgwNV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OTFhZDU4MzU1M2FkNmIzNjZlNjQ3NDdkYWM2ZmVhYTlfN2M5N2E0ODk1NTMyODBlNzhhNTkyZThmZjA5Zjc2ZTNfSUQ6NzY0NjMyOTM3OTc1MjY5MjY5NF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NGMwMzA5MjcwYTVkZjY3NzU2YmMxMzJhMDAwY2Y2ZTRfMGI3ZWY5MmUwNjIyYWYyOTg5MTljNWZmYjI3ZTcxMTVfSUQ6NzY0NjMyOTM4MDMwMTk4MjY5NF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

### 功能逻辑

租户管理

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：新增租户|1、点击新增租户按钮，弹出新增租户弹窗<br>2、新增租户<br>1）企业名称：支持文本输入，长度不限，必填，唯一性校验，不可重复。<br>2）企业编码：唯一标识码，支持英文和数字，长度不限制。必填，唯一性校验，不可重复。<br>3）企业地址、联系人、联系电话：非必填，文本输入，长度不限。<br>3、点击确定，调用服务端在当前登录的租户下新增下级租户信息。如果企业编码、企业名称已存在，输入框下飘红提示。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NTRkMzA2MWE4NDBiOGIxZGVkMTk0MmNhMmY2ZTIxNWZfZjM4MzAyMWYyZjNhOTE0ZTgxN2VkNmNlODYwZTFlODBfSUQ6NzY0NjMyOTM4MDA4ODAwNzY0NF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)<br>|
|2：编辑租户|1、点击编辑租户按钮，弹出编辑租户弹窗<br>2、编辑应用<br>1）企业编码：输入框置灰，不可修改。<br>2）企业名称、企业地址、联系人，联系电话，回显应用的相关内容信息。<br>3、点击确定，调用服务端更新租户信息。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ODZkMDAxYWRhODA0YmFhMzViZjM4ZGY3OTNjNGE0NWZfZDJmYmNlMGM1YzMzY2JmNTI1N2U2ZTdkNmU2YzU5ZTNfSUQ6NzY0NjMyOTM3OTU3NjUxNTgwNV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)<br>|
|3：开通账号|点击后，页面跳转至开通账号页面。||
|4：删除租户|1、未开通管理员账号的租户，可删除，点击后弹出二次确认弹窗，确认后正常删除租户信息。<br>2、已开通租户管理员的租户，暂不可删除。|![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTMwNjIxMmIzMjZlOTU2N2M2ODU5MjY3N2NkODk0OTZfYjYyNDJiMWEyN2VlZjYzNjI3OWNjNzlkZmVjMTBjMTRfSUQ6NzY0NjMyOTM4MTMzMzQyMTI2OF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)|
|5：查询租户|1、查询条件<br>1）企业编码：精准查询，输入框支持文本输入，长度不限。<br>2）企业名称：模糊查询，输入框支持输入文本，长度不限制。<br>3）管理员账号：精准查询，输入框支持文本输入，长度不限。<br>4）创建时间：日期区间选择组件，无默认日期区间展示，由用户选择。<br>2、点击查询，调用服务端租户列表查询能力，列表渲染同时满足多项查询条件的租户信息。<br>3、点击重置，清空已选择的查询条件，列表按默认条件渲染数据。||
|6：租户列表展示|1、根据登录用户所在的租户层级及数据权限，查询下级租户数据。<br>2、列表展示字段<br>1）序号：默认按行，从1\~10，根据每页展示的条数展示。<br>2）企业编码、企业名称、企业地址、联系人、联系方式，根据租户内容展示。<br>3）管理员账号：未开通账号展示\-，已开通展示该租户关联的账号信息。<br>4）创建时间：应用首次创建入库的时间。<br>5）操作列：未开通账号租户，编辑、开通账号、删除；已开通账号租户，编辑。<br>2、列表默认展示顺序，创建时间倒序，最近创建的租户最前面展示。默认每页10条。<br>3、分页条数：10、20、50、100条每页。||

开通账户

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：创建账号（第一步）|1、创建账号<br>1）用户昵称：支持文本输入，长度20个字符，必填，不做唯一性校验，可重复。<br>2）登录邮箱：支持输入英文、数字、特殊字符，必填，做常规邮箱格式校验，不符合邮箱格式，输入框下飘红是提示，请输入正确格式的邮箱。<br>3）角色：置灰，不可选择，默认管理员角色（下级租户管理员权限）。<br>3、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户，根据不同情况进入第二步。<br>4、点击返回，返回到租户管理列表页。||
|1：创建账号（第二步，账号不存在）|1、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户。<br>2、当前用户中心不存在该邮箱创建的用户时，以登录邮箱为唯一表示，在用户中心创建用户，并建立应用下对应租户下数据的关联关系。<br>1）用户ID：根据系统ID生成规则生成<br>2）登录邮箱：为用户第一步创建时填写的邮箱信息。<br>3）初始密码：使用大写英文字母和数字，生产8位的随机字符。<br>并赋予本用户该租户下级的管理员角色<br>3、复制信息：点击后，将登录邮箱，初始密码复制到系统粘贴板上，并toast提示：复制成功<br>4、点击完成：页面跳转至租户列表。||
|1：创建账号（第二步，账号已存在）|1、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户。<br>2、当前用户中心已存在该邮箱创建的用户时，页面展示已存在的用户信息，展示用户ID、登录邮箱、用户昵称<br>3、复制信息：点击后，将登录邮箱、用户昵称复制到系统粘贴板上，并toast提示：复制成功<br>4、使用该账号创建，在当前用户角色的基础上，添加第一步已选对应租户下角色信息，已存在的不做添加。<br>5、点击上一步，返回到第一步，点击完成，页面调整至用户列表。||

## 车辆管理（定制）

### 功能描述：

提供当前登录租户及其下级租户名下所有车辆资产

### 使用场景：

在此描述

### 功能流程：

在此上图

### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTFmNWVkYjUwMGQ1NGQxMjg5YzNiYTcwY2YxOTgwYWJfNTUzMTExMWQ0ZmNjYTI1N2QzNmUyZjE1NTZkOTVjMjVfSUQ6NzY0OTY5MDg1OTUwMDA5NjUwMF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZmRlMDBlZDdmZmFlOTE4YTM5MThmNDk1NDhhYjQ0OTJfZmRlOTQ4Y2NiYTgwZjE2NmU1NjYzYzkxMzliYzA4NzlfSUQ6NzY0OTY5NDM0NTExNzA0Mzk0N18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MGQzZjAyNWQwMjIzNmU5NmI1MTcxZDViZWE2ZDZkNDhfMDRhMzg5ZDA0YTU2YWY5YTVjYzgxZTdiNzI2YzVjNjBfSUQ6NzY0OTY5NDM3NzEzNjE5NjU3Ml8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZjNjY2RkNjA3Y2NjZjYyOWZiZTQ2NzgzYzdmN2U2ZGZfODE2OGJlZDk1YzM5NWFjY2M5MjZiZGVkMGQ2ZTU0NGZfSUQ6NzY0OTY5NDQwMzgxNjU5MDMwOV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YWVjM2FhNDMwYTVlYWRmODVlZGFiZThmNGQ4ODE3ODFfOGJmZmM2NzM5MTIzNTQzYzZiNTRiOTBlMTRiYTdmNjlfSUQ6NzY0OTY5NDQ0NzMwMzk2OTczMF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OWQwNTdlY2ZkNmY4MzViYjg4ZWM2NmZiMWI2M2ZiZDFfZWFmNjI3MmQxMWU4NzFjM2Y1YTRjOTY4YjNhNmNlNGRfSUQ6NzY0OTY5NDQ4MDU4MTAyMDg1MV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZThmZmFiNTg0YTdiMmVkZGJkMDgxNDZiNWFjZDU4OWZfYWNiM2NhMTMwMTliOWE5ZmYzZmJkZjhjM2ZhZGQ5OGJfSUQ6NzY0OTY5NDUxMjkyMjg0MDI2NF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YjY2OGJkZTQzNDc2MGUzMWU1ODY4MDgzODZhZGFlYTVfNjIyNjAzNjRmYmQ4ODI0YjVhNjAwNDE2MDE1Y2UwMjZfSUQ6NzY0OTY5NDU0MjM4ODkzOTk3MV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ODcxNjJhODBmNWRhMDA0MjRlNmY1M2FjNjgxNDE2MzVfNzhhNzExMTY0YjEwOGI4ZmMzMzBkODE2Zjk0Nzg2ZjZfSUQ6NzY0OTY5NDIzNzQwMzQzNDIyN18xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|车辆列表|- 功能逻辑<br>    - 数据权限隔离：展示当前租户及其下级租户名下所有车辆的信息<br>- 字段信息<br>    - VIN码<br>    - 车牌号<br>    - 设备ID：车辆绑定的OBD设备ID<br>    - 车型：车辆型号<br>    - 外观：车辆颜色<br>    - 电池版本：车辆的电池版本<br>    - 购车时间：人车关系表中的购车时间，格式“YYYY\-MM\-DD”<br>    - 车龄：基于购车时间动态计算<br>        - 规则：\(当前日期 \- 购车日期\) / 365，保留1位小数，如 2\.5年<br>    - 总里程：车辆累计行驶里程，单位“km”，取整数<br>    - 最后位置：经纬度逆地址解析后的文字描述（如：xx市xx区xx街道xx号）<br>        - 过长时省略显示，点击气泡展示完整地址<br>- 功能按钮<br>    - 批量导入<br>    - 查看详情：点击进入车辆详情<br>- 排序及分页<br>    - 按车辆添加时间倒序排列<br>    - 分页默认20条，支持10/20/50/100||
|批量导入|- 导入的车辆数据，必须在当前租户的资产池中已存在相应的 VIN 码<br>    - 若系统中存在该 VIN 且归属当前租户，执行更新操作，将 Excel 中的字段信息覆盖至数据库<br>        - 可覆盖字段：外观、车牌号<br>        - 不可覆盖字段：VIN码、购车时间、车型、绑定设备号、车龄、总里程数、电池版本、最后位置<br>- 下载模板<br>    \[导入下载模板\.xlsx\]<br>- 文件校验<br>    - 文件格式错误，校验后缀非\.xls/\.xlsx/\.csv提示“请上传正确的 Excel 文件格式”<br>        - 整个文件导入失败<br>    - 文件过大，单次上传不超过50MB，超限提示“文件过大，请分批导入”<br>        - 整个文件导入失败<br>    - VIN码为空，提示“请填写正确VIN码”<br>        - 跳过错误数据，正确数据导入成功<br>        - 生成失败明细<br>    - VIN码格式错误，未满足17位，提示“请填写正确VIN码”<br>        - 跳过错误数据，正确数据导入成功<br>        - 生成失败明细<br>    - VIN码重复，同一文件内VIN重复，仅保留首行<br>        - 跳过错误数据，正确数据导入成功<br>        - 生成失败明细<br>    - 该租户数据中不存在该 VIN，提示“请填写正确VIN码”<br>        - 跳过错误数据，正确数据导入成功<br>        - 生成失败明细<br>- 失败明细逻辑<br>    - 记录原始的错误数据<br>    - 支持excel格式下载失败明细||
|车辆详情|- 车辆信息<br>    - VIN码<br>    - 车牌号<br>    - 车型<br>    - 外观<br>    - 购车时间<br>    - 车龄<br>    - 电池版本<br>    - 总里程数<br>    - 最后位置<br>- 设备信息<br>    - 设备ID<br>    - 设备名称<br>    - 设备类型<br>    - 设备型号<br>- 台账tab<br>    - 风控预警记录<br>    - 驾驶预警记录<br>    - 电池监控信息<br>    - 充电记录<br>    - 行程记录<br>    - 维修记录<br>    - 里程报表<br>- 页面布局<br>    - 页面左侧展示车辆信息、设备信息<br>    - 页面右侧展示台账tab栏及tab对应的列表<br>    - tab栏选项：<br>        - 风控预警记录<br>        - 驾驶预警记录<br>        - 电池监控信息<br>        - 充电记录<br>        - 行程记录<br>        - 维修记录<br>        - 里程报表<br>- 分页及排序<br>    - 默认20条/页，支持10/20/50/100<br>    - 按报警时间倒序|<br>|
|风控预警记录tab<br>|- 功能逻辑<br>    - 每条预警都生成一条独立的记录<br>- 字段信息<br>    - 预警名称：取车辆信号的应用字段<br>        - VDC故障报警<br>        - CDCU故障报警<br>        - BDCU故障报警<br>        - ADAS故障报警<br>        - 温度差异报警<br>        - 电池高温报警<br>        - 车载储能装置过压报警<br>        - 车载储能装置欠压报警<br>        - SOC低报警<br>        - 单体电池过压报警<br>        - 单体电池欠压报警<br>        - SOC 过高报警<br>        - SOC 跳变报警<br>        - 可充电储能系统不匹配报警<br>        - 电池单体一致性差报警<br>        - 绝缘报警<br>        - DC\-DC 温度报警<br>        - DC\-DC 状态报警<br>        - 驱动电机控制器温度报警<br>        - 高压互锁状态报警<br>        - 驱动电机温度报警<br>        - 车载储能装置类型过充<br>        - 充电故障报警<br>    - 预警内容：CAN数据解码得出<br>    - 预警时间：预警触发时间，格式yyyy\-mm\-dd hh:mm:ss||
|驾驶预警记录tab|- 功能逻辑<br>    - 每条预警都生成一条独立的记录<br>- 字段信息<br>    - 预警名称：取车辆信号的应用字段<br>        - 对车一级预报警<br>        - 对车二级紧急报警<br>        - 对车 AEB 制动<br>        - 对人一级预警<br>        - 对人二级预警<br>        - 对人 AEB 制动<br>    - 车速：触发预警时的车速<br>    - 预警时间：预警触发时间，格式yyyy\-mm\-dd hh:mm:ss||
|电池监控信息tab|- 功能逻辑<br>    - 每条信号都生成一条独立的记录<br>- 字段信息<br>    - SOC<br>    - 电池健康度<br>    - 电池温度<br>    - 续航里程||
|充电记录tab|- 功能逻辑<br>    - 每条信号都生成一条独立的记录<br>- 字段信息<br>    - 电压：示例378V<br>    - 电流：示例45A<br>    - 功率：示例17\.5kW<br>    - 充电前电量：示例30%<br>    - 充电后电量：示例92%<br>    - 充电时长：示例2小时32分钟<br>    - 累计充电次数：车辆接入平台后累计充电次数<br>        - 车辆首次接入平台时，累计充电次数为0<br>        - 计算规则：取充电记录次数<br>    - 记录时间：格式 YYYY\-MM\-DD HH:mm:ss||
|行程记录tab<br>|- 功能逻辑<br>    - 每条信号都生成一条独立的记录<br>    - 行程定义：车辆（设备）上报GPS持续时间≥5分钟时即视为有效行程，超过10分钟未上报GPS则视为行程结束<br>- 字段信息<br>    - 开始时间<br>    - 结束时间<br>    - 起点<br>    - 终点<br>    - 行驶里程<br>    - 行程时长<br>    - 平均车速<br>    - 预警次数：此行程中触发的预警次数，包含驾驶预警、围栏预警、故障预警、低电量报警||
|维修记录tab<br>|- 数据来源：<br>    - 故障报警中一键报修<br>    - 电池报警中一键报修<br>    - 维修记录中创建维修记录<br>- 字段信息<br>    - 维修类型：<br>        - 故障类<br>        - 电池类<br>    - 维修描述：取故障报警、电池报警的风险类型名称<br>    - 开始时间<br>    - 结束时间：取点击“完成维修”的时间<br>    - 操作人：取最近操作的操作人<br>    - 维修状态<br>        - 维修中<br>        - 维修完成<br>- 功能按钮<br>    - 完成维修：维修状态为“维修中”的记录，显示“完成维修”按钮，点击则调整状态为“维修完成”，隐藏此按钮||
|里程报表tab|- 折线图展示该车里程报表<br>    - X轴<br>        - 选择日，展示近30天每天的里程<br>        - 选择周，展示近30周每天的里程<br>        - 选择月，展示近12个月每月的里程<br>        - 选择年，展示近3年每年的里程<br>    - Y轴：单位km<br>- 支持选择时间维度展示该车的里程数据<br>    - 时间维度选项：日、周、月、年||

### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|车辆列表|VIN码|文本输入框|- 最多17个字符<br>- 支持输入字母、数字|- 模糊匹配|
||车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||设备ID|文本输入框|- 最多20个字符<br>- 支持输入字母、数字|- 模糊匹配|
||电池版本|文本输入框|- 最多20个字符<br>- 支持输入字母、数字、中文|- 模糊匹配|
||车龄|数值范围输入（最小车龄 \+ 最大车龄）|- 最小值≥0，最大值≤100<br>- 小数最多支持1位|- 车龄命中选择的数值范围|

## 围栏管理（基线）

### 功能描述：

设置电子围栏

### 使用场景：

设置电子围栏管控车辆

### 功能流程：

无需

### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MzRiZDY2MTNlYmZlNzZhYzE0MWI3ODUzNzdiZjNhODlfYWY5OGYyYTg0YTM1ZDZlMDAxM2M3ODVkNDdjYjY3YTZfSUQ6NzY1MTU1OTg1MzgzNzA3Nzc0Ml8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NzdhNTI1MTBkMDcxZTAzNWM5Y2U4OTMxYmY3M2ZjYjdfNzcyMDQ3NmQ3NTU3OTYyNGQxNGFjYzY3ODU4ZmU1YjJfSUQ6NzY1MTU2MDEzMDgxNTQ2MjM0OF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YWFmOTc1ODM0MjJjMzhkNGYxN2U3MDg0NmIxMTFkMzRfYTA3MWQ1NmFkYmE4MTBlOGZlYjBmZTZmZjUxNWRlY2FfSUQ6NzY1MTU2MDIwNzc2MDAwMjI0M18xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NDNlNjJiYzUyNzkwZmE5N2Y5YjJmYTViNDEwZDNlNGVfNzk4MTA5YjE2Y2UzYzEwZWZkZDc2ZWY2MmZiZmIwYWRfSUQ6NzY1MTU2MDI1NTYzMDI5ODMzMF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MmNlNDg1ZDUzYTlhYjY4MzFiNDViMDE5MWQ5NDdlOTdfYTE1ODQ1MzU0NDY2MGIzZmU5ZTMwNGFkMWI4OWM4OGRfSUQ6NzY1MTU2MDMyNDE1NjEzMjMyN18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|围栏列表|- 序号：展示列表数据序号<br>- 围栏名称：展示围栏名称<br>- 围栏类型：中心点围栏/自定义围栏<br>- 使用车辆：使用此围栏的车辆数量<br>    - 点击进入车辆配置页配置此围栏的车辆，支持添加、删除车辆<br>- 预警类型：出栏报警、入栏报警<br>- 状态：生效中/未生效<br>- 围栏地址：展示中心点围栏的详细地址信息<br>    - 自定义围栏展示为“— —”<br>- 操作人：展示最近一次新建/编辑/开/关围栏的系统用户信息<br>- 操作时间：展示最近一次新建/编辑/开/关围栏的时间；格式：格式yyyy\-mm\-dd hh:mm:ss<br>- 排序及分页<br>    - 列表数据按照创建时间倒序排列<br>    - 分页默认20条，支持10/20/50/100||
|车辆配置页|- 入口：点击围栏列表中的“使用车辆”进入<br>- 列表字段<br>    - 序号<br>    - VIN码<br>    - 车牌号<br>    - 添加时间<br>- 添加车辆<br>    - 点击弹窗选择车辆添加<br>    - 支持输入车牌号、VIN码快速查找车辆<br>- 删除车辆<br>    - 二次确认后即可删除<br>    - 删除后此车辆不适用该围栏，支持重新添加||
|新建围栏|- 围栏名称：必填，最长30个字符<br>- 围栏类型：必填；单选；中心点围栏/自定义围栏；默认中心点围栏<br>- 预警类型：必填；仅支持单选；出栏报警、入栏报警<br>- 围栏地址：<br>    - 必填<br>    - 围栏类型选择“中心点”围栏才有此字段<br>    - 支持用户输入详细地址信息查询为看中心点；<br>    - 若用户直接在地图中选择围栏中心点则需回显地址信息<br>- 围栏半径：<br>    - 必填<br>    - 围栏类型选择“中心点”围栏才有此字段<br>    - 输入限数字、单位km<br>    - 半径不得为0<br>    - 半径不得大于100km<br>- 自定义围栏设置：<br>    - 支持用户自定义在地图中标记99个点位并连接闭合|- 提交数据时需校验必填项与围栏点位是否闭合<br>- 自定义围栏设置时需支持「上一步」、「清除点位」操作<br>- 地图需支缩放、拖拽移动<br>|
|编辑围栏|- 逻辑同上||
|查看详情|- 点击进入详情展示围栏详细信息<br>- 中心点围栏展示信息：围栏名称、围栏类型、围栏地址、围栏半径、预警类型、地图（展示中心点围栏的中心点及半径覆盖区域）<br>- 自定义围栏展示信息：围栏名称、围栏类型、地图（展示自定义围栏覆盖区域）||
|删除|- 围栏关闭时才支持删除|删除需二次确认|
|开关|- 开启：围栏启用（生效）<br>- 关闭：围栏禁用（不生效）|关闭需二次确认|

### 搜索筛选项字段约束

|页面|搜索项名|搜索方式|位数限制|数据区间|输入方式|约束条件|
|---|---|---|---|---|---|---|
|围栏管理页|围栏名称|模糊查询|不限|不限|文本输入|无|
||围栏类型|精确匹配|/|中心点围栏/自定义围栏|下拉选择|单选|
||围栏状态|精确匹配|/|生效中/未生效|下拉选择|单选|
||操作时间|精确匹配|不限|/|时间选择器选择|支持时间段筛选，时间精确到分钟；最长支持一年|
|车辆配置页|VIN码|模糊匹配|最多17个字符|/|文本输入框|支持输入字母、数字|
||车牌号|模糊匹配|最多8个字符|/|文本输入框|支持输入汉字、字母、数字|
|添加车辆弹窗|VIN码|模糊匹配|最多17个字符|/|文本输入框|支持输入字母、数字|
||车牌号|模糊匹配|最多8个字符|/|文本输入框|支持输入汉字、字母、数字|

## 风控预警

### 围栏报警（基线）

#### 功能描述：

无

#### 使用场景：

无

#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MTJmMmVhYzc4ZjhiNzU5YmU0ZDAxMDU4ODUxZTVlMmFfMjFjZTI0NDhkZTI3MzQwNGQ3YTFjOWVmNTc2MDBhZTVfSUQ6NzY0OTY5MTU4NjU3MDE2MTEwOV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YzFkM2VkOGZmNDg0MDg4M2I3NmYyNTk3OGZlNWQ1YjZfNGEwNTk5MWRlNmFlOTk2YjFlMWEyZWY2NmNkNzVhN2VfSUQ6NzY0OTY5MTgzNDM5NTQxMzc0N18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|全局<br>|- 数据分页加载<br>- 排序：按照数据上报时间倒序排列<br>- 报警数据按照设备维度关联车辆信息展示；若一辆安装多台设备，则有多条预警信息||
|围栏报警|- 数据来源<br>    - OBD设备上报<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 设备ID<br>    - 报警类型<br>        - 出栏报警<br>        - 入栏报警<br>    - 围栏名称<br>    - 报警位置：触发围栏报警时车辆所在位置<br>    - 报警时间<br>- 查看详情<br>    - 基本信息<br>        - 车牌号、VIN逻辑同列表<br>    - 围栏信息<br>        - 围栏名称<br>    - 设备数据<br>        - 报警时车速<br>        - 报警位置<br>        - 报警时间：格式yyyy\-mm\-dd hh:mm:ss<br>    - 地图<br>        - 在地图中展示预警上报点位、围栏范围<br>        - 需展示预警时间、详细地址||

### 故障报警（定制）

#### 功能描述：



#### 使用场景：



#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NGY5MWQwZjFiMjUwZjMxNzA0MTAxY2ZjODQ3MDVlMjJfOTNhNjM2ODcxMmI4NWE2N2YzYjBhMWI4YzBlMDNmMzlfSUQ6NzY0OTY5MjE4NzY1MTkzNTIxOV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|全局<br>|- 数据分页加载<br>- 排序：按照数据上报时间倒序排列<br>- 报警数据按照设备维度关联车辆信息展示；若一辆安装多台设备，则有多条预警信息||
|故障报警|- 数据来源<br>    - OBD设备上报<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 设备ID<br>    - 报警类型：故障报警的类型<br>        - 枚举值：VDC故障、CDCU故障、BDCU故障、ADAS故障<br>    - 报警内容：解析车辆信号<br>    - 报警时间：格式yyyy\-mm\-dd hh:mm:ss<br>    - 报警状态<br>        - 未处理<br>        - 维修中<br>        - 维修完成<br>- 一键报修<br>    - 点击一键生成维修工单，自动带入车辆数据<br>    - 点击后报警状态同步变更为【已生成工单】<br>    - 仅【未处理】状态时展示【一键报修】按钮<br>- 分页及排序<br>    - 默认20条/页，支持10/20/50/100<br>    - 按报警时间倒序||

### 电池报警（定制）

#### 功能描述：



#### 使用场景：



#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTk4NDJjOWIwYmJhN2Q3MjZmNmE0YTUyZDA3MGY0MmVfOGQ1MDAyNWU2YzUyNzQ5ZGU0N2Q3MWI4OWNkOGU5YWZfSUQ6NzY0OTY5MjI0MzgyMTM5OTAxNF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|全局<br>|- 数据分页加载<br>- 排序：按照数据上报时间倒序排列<br>- 报警数据按照设备维度关联车辆信息展示；若一辆安装多台设备，则有多条预警信息||
|电池报警|- 数据来源<br>    - OBD设备上报<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 设备ID<br>    - 报警类型：电池报警的类型<br>        - 枚举值：SOC过低、电池高温、SOC跳变、充电故障、温差报警；<br>    - 预警内容：解析车辆信号<br>    - 报警时间：格式yyyy\-mm\-dd hh:mm:ss<br>    - 报警状态<br>        - 未处理<br>        - 维修中<br>        - 维修完成<br>- 一键报修<br>    - 点击一键生成维修工单，自动带入车辆数据<br>    - 点击后报警状态同步变更为【已生成工单】<br>    - 仅【未处理】状态时展示【一键报修】按钮<br>- 分页及排序<br>    - 默认20条/页，支持10/20/50/100<br>    - 按报警时间倒序||

## 驾驶行为（定制）

### 驾驶预警

#### 功能描述：

监控车辆驾驶过程中的风险事件

#### 使用场景：

结合预警数据提前发现潜在碰撞风险，预防事故

#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NDhkOTgzZGMyYTc3ODViNzQxNmNkYWM5Yjg2MzU0ZWNfMDM1ZGI1NDU0YWMyYjI2NmVhYjkxZDBmZjQ5YWNhZmZfSUQ6NzY0OTY5MjMyNTc1NjcxODMyMV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|驾驶预警<br>|- 数据来源：OBD设备上报的风险事件<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 预警类型：驾驶预警的类型<br>        - 枚举值：急加速、急减速、急转弯、疲劳驾驶、AEB制动<br>    - 预警时间：格式yyyy\-mm\-dd hh:mm:ss<br>    - 预警位置：默认收起位置信息，点击“查看位置”时查询展示位置信息<br>    - 行车速度：单位km/h<br>- 分页及排序<br>    - 默认20条/页，支持10/20/50/100<br>    - 按预警时间倒序|<br>|

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|驾驶预警|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||选择时间|日期选择器|- 格式YYYY\-MM\-DD<br>- 需选择起止时间|- 预警时间命中选择的时间范围|
||预警类型<br>|下拉选择|- 单选<br>- 枚举值<br>    - 急加速<br>    - 急减速<br>    - 急转弯<br>    - 疲劳驾驶<br>    - AEB制动<br>    - 全部||

### 驾驶报告

#### 功能描述：

评估车辆驾驶过程中的风险行为

#### 使用场景：

给予司机警示

#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZGNiNTY5ZWFkYmNmY2FjOWEwMzA4MjExM2FiMjkwMmNfMjhlN2I1YTQ5OTE5YjA0YzgzOTIwYmFmYjkwNDk4MjhfSUQ6NzY0OTY5MjM4MDQ4MDUzOTgzOF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YjNhN2JlZTM5YmExZWEwZjQwMzFiNWZkMjA3MWNmMzlfMWNiYzg2NWZiMjExYzM2YzI2YjM5ZjliN2ZkYzdlN2RfSUQ6NzY0OTY5MjQzMjI3MTQxMjIwNF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|驾驶报告<br><br>|- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 报告时间<br>        - 周报示例：2025年第21周<br>        - 月报示例：2025年2月<br>    - 风险等级：<br>        - 安全司机<br>        - 低危司机<br>        - 中危司机<br>        - 高危司机<br>    - 行驶里程：单位km<br>    - 触发风险数：触发风险的数量<br>    - 驾驶评分：展示评分数值<br>- 分页及排序<br>    - 默认20条/页，支持10/20/50/100<br>    - 按报告时间倒序<br>- 月报周报tab栏<br>    - 默认展示周报，支持切换成月报|<br>|
|驾驶报告\-详情页|- 字段信息<br>    - VIN码<br>    - 车牌号<br>    - 报告时间<br>    - 车型<br>    - 外观<br>    - 车龄<br>- 数据指标<br>    - 累计行驶里程：单位km<br>    - 累计行驶时长：单位h<br>    - 平均车速：单位km/h<br>    - 驾驶评分：取整<br>- 数据图表<br>    - 行驶里程趋势<br>        - 图表形式：折线图<br>        - 计算规则：每天行驶里程<br>        - 单位：<br>            - X轴：周报为星期一到星期日；月报为当月第一天到当月最后一天；<br>            - Y轴：km<br>    - 驾驶时间段占比<br>        - 图表形式：环形图<br>        - 计算规则：驾驶时间段中白天、夜间的占比<br>    - 行驶区域分布<br>        - 图表形式：柱状图<br>        - 计算规则：上报的位置信息中，在每个城市行驶的里程数<br>        - 单位：<br>            - X轴：行驶过的城市<br>            - Y轴：km<br>- 风险事件统计：<br>    - 图表形式：折线图<br>    - 计算规则：行驶过程中触发的各风险事件数量<br>    - 单位：<br>        - X轴：周报为星期一到星期日；月报为当月第一天到当月最后一天；<br>        - Y轴：数值<br>- 驾驶改善建议内容<br>    - 对每辆车按照周/月根据驾驶行为给出驾驶改善建议|<br><br><br><br>|

#### 风险等级\&驾驶评分规则

##### 评估维度与指标

|指标|判定标准|
|---|---|
|急减速频次|出现多次强制减速（加速度小于 \-3 m/s²）|
|急加速频次|出现多次急速提速（加速度大于 2\.5 m/s²）|
|急转弯频次|在 ≥ 40km 行驶下频繁急打方向|
|AEB制动频次|车辆多次自动介入制动|
|夜间行驶次数|在凌晨 00:00 至 05:00 之间长时间驾驶|
|疲劳驾驶次数|单次连续驾驶超过 4 小时|

##### 风险等级划分规则

|风险等级|划分规则|
|---|---|
|安全司机|所有行为表现良好，最多 1 项中等风险，其余均为低风险或正常|
|低危司机|有 2\~3 项行为为中等风险，无严重危险行为|
|中危司机|出现 1 项严重行为，或有 4 项及以上中等风险行为|
|高危司机|出现 2 项及以上严重行为，驾驶行为较为危险|

##### 驾驶评分计算规则

|数据项|急加速|急减速|急转弯|疲劳驾驶|AEB制动|
|---|---|---|---|---|---|
|权重|20%|20%|20%|20%|20%|

|次数（次）|急加速|急减速|急转弯|AEB制动|时长（时）|疲劳驾驶|
|---|---|---|---|---|---|---|
|0|100|100|100|100|0|100|
|2|90|90|90|90|1|90|
|4|80|80|80|80|2|80|
|6|70|70|70|70|3|70|
|7\-10|60|60|60|60|4|60|
|＞10|50|50|50|50|≥5|50|

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|驾驶报告|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||报告时间|日期选择器|- 周报tab<br>    - 按周选择<br>    - 仅支持选择历史1年内的周<br>    - 默认选择上周<br>- 月报tab<br>    - 按月选择<br>    - 仅支持选择历史1年内的月<br>    - 默认选择上月||
||风险等级|下拉选择|- 单选<br>- 枚举值<br>    - 安全司机<br>    - 低危司机<br>    - 中危司机<br>    - 高危司机<br>    - 全部||

## 电池管理（定制）

### 电池监控

#### 功能描述：

用于监控新能源车辆的电池状态

#### 使用场景：

车队管理者查看所有车辆的电池健康度，及时发现电池衰减异常车辆。

#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=Y2Y3OTI3ZGZkZTZiODFhZmU4MDM5NWE0YzY0M2FkMDhfY2M5YTVhMjYxMDhiZWIzNjcxN2FiYjdjMDA3ODE1NGVfSUQ6NzY0OTY5MjQ5MDM0NjU5NzU4MF8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YzYwNzQxZWYwMGUxNjU5ZmYyOWRhYTdhMDUwMDlkZWJfYzM2NWNiYWVmZDYxNmNkNjU4MzQwMDUzZmVlZDkxZDlfSUQ6NzY0OTY5MjYzOTU2NjE1NDk4NV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|电池监控列表<br>|- 功能逻辑<br>    - 列表数据更新机制：按依赖数据计算频率，计算完毕实时更新列表数据<br>- 数据指标<br>    - 平均SOC：所有车辆最新 SOC 的算术平均值（%）<br>    - 平均电池温度：所有车辆最新电池温度平均值（℃）<br>    - 平均续航：所有车辆最新续航里程平均值（km）<br>    - 低电量报警：当前触发低电量报警的车辆数量<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - SOC：最近一次上报的SOC值<br>    - 电池温度：最近一次上报的电池组平均温度<br>    - 续航里程：取车辆信号【持续行驶里程（续航里程）】<br>    - 累计充电次数：车辆接入平台后累计充电次数<br>        - 车辆首次接入平台时，累计充电次数为0<br>        - 计算规则：取充电记录次数<br>    - 电池健康度：取车辆信号【电池健康度（SOH）】<br>- 分页及排序<br>    - 默认 20 条/页，支持 10/20/50/100<br>    - 按车辆录入时间倒序排列||
|电池监控详情页|- 数据指标<br>    - SOC值：同列表<br>    - 电池健康度：同列表<br>    - 电池温度：同列表<br>- 数据图表<br>    - 日均电耗趋势<br>        - 图表类型：折线图<br>        - 计算规则：展示近30 天的每日耗电数据（kWh/100km）<br>        - 计算公式：<br>            - 日放电量=【当日23:59:59的累计耗电量】\-【当日00:00:00的累计耗电量】<br>            - 日里程=【当日23:59:59的车辆总累计行驶里程】\-【当日00:00:00的车辆总累计行驶里程】<br>            - 日均电耗=【日放电量/日里程】✖️100，单位：kWh/100km。<br>            - 如该时刻无上述数据，则取当天内最接近该时刻的值插入。||

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|电池监控列表|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|

### 充放电记录

#### 功能描述：

用于监控新能源车辆的充放电数据

#### 使用场景：

查询特定时间段内车辆的充放电记录，用于费用核对或异常排查。

#### 功能流程：

在此上图

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NzY1OGQzOWVlYTk3OGE1YjZkNzdhNWZhMDNhODQ0ZmNfOWI0YTdhMGVjMGI5ZTIzMDBiNjhhOTZmNGZlNDQxNzRfSUQ6NzY0OTY5MjY4NzY5MjQxODAyMV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTJjYjQxMzRhZDFlNDQxNGUzNmRlOWJlZGYwZjQzNTJfN2FmMjNiM2U2ZGU4N2YxMTcxNzQ5MTcyMzk0YmE3NWVfSUQ6NzY0OTY5MjcyNzYzODI0ODQyMV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|充放电记录列表|- 提供充电记录、放电记录tab切换栏<br>- 默认选择充电记录||
|充电记录<br>|- 功能逻辑<br>    - 判定车辆充电的逻辑：通过车辆信号【车辆充电状态】判断，信号值为0100b/0011b且车辆电流＞\+2A且持续1分钟时，判定为充电<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 电压：充电期间的平均电压<br>    - 电流：充电期间的平均电流<br>    - 功率：平均充电功率<br>    - 充电前电量：开始充电时的 SOC<br>    - 充电后电量：结束充电时的 SOC<br>    - 充电时长：结束时间 \- 开始时间，格式hh：mm<br>    - 记录时间：充电结束生成记录的时间，格式 YYYY\-MM\-DD HH:mm:ss<br>- 分页及排序<br>    - 默认 20 条/页，支持 10/20/50/100<br>    - 按记录时间倒序排列||
|放电记录<br>|- 功能逻辑<br>    - 判定车辆放电的逻辑：通过车辆信号【车辆充电状态】判断，信号值为0000b且车辆电流＜\-2A且车速＞0且持续1分钟时，判定为放电<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 电压：放电期间的平均电压<br>    - 电流：放电期间的平均电流<br>    - 功率：平均放电功率<br>    - 放电前电量：开始放电时的 SOC<br>    - 放电后电量：结束放电时的 SOC<br>    - 放电时长：结束时间 \- 开始时间，格式hh：mm<br>    - 记录时间：放电结束生成记录的时间，格式 YYYY\-MM\-DD HH:mm:ss<br>- 分页及排序<br>    - 默认 20 条/页，支持 10/20/50/100<br>    - 按记录时间倒序排列||

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|充电列表|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||选择时间|日期选择器|- 格式YYYY\-MM\-DD<br>- 需选择起止时间|- 记录时间命中选择的时间范围|
|放电列表|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||选择时间|日期选择器|- 格式YYYY\-MM\-DD<br>- 需选择起止时间|- 记录时间命中选择的时间范围|

## 行程管理（定制）

### 功能描述：

在此描述

### 使用场景：

在此描述

### 功能流程：

在此上图

### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MjIzMGQ0MDkzYzM3NzljNTcxOGVlZDFlM2FiMmRkNWNfNzFlNjAyODcyYjVhNWJiYTlmMjJjMzExMmE2ZjRhMmZfSUQ6NzY0OTY5MzYzNTAyMTYwNTg1N18xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZWEzYjA4NjFhMzVkMzBhYzk1OTBjMTRiNjNiYTcwYTBfOGRhOTRmOGI1YTU2MTJlYmQzNTZmOTViZGMxZWQ5YjRfSUQ6NzY0OTY5Mjk4MzMwNjM1Nzk3MV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

### 功能逻辑

与车辆详情「行程记录tab」的关系：同一套数据，车辆详情tab展示单车的行程记录，本模块展示全租户维度的汇总。

|功能名称|功能逻辑|交互说明|
|---|---|---|
|行程记录列表<br>|- 功能逻辑<br>    - 开始行程定义：设备开始上报GPS定位信息，且上报持续时长≥5分钟<br>    - 结束行程定义：设备超过10分钟未上报定位数据则结束行程生成行程记录，否则属于行程中<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 开始时间<br>    - 结束时间<br>    - 起点：默认收起，点击「查看位置」解析详细地址<br>    - 终点：默认收起，点击「查看位置」解析详细地址<br>    - 行驶里程<br>    - 行程时长<br>        - 结束时间\-开始时间，格式hh:mm<br>    - 平均车速<br>    - 预警次数:该行程中触发的驾驶预警事件总数<br>- 排序及分页<br>    - 按车辆添加时间倒序排列<br>    - 分页默认20条，支持10/20/50/100<br>- 操作按钮<br>    - 查看详情：点击进入行程记录详情页|<br>|
|行程记录详情页|- 字段说明<br>    - VIN码<br>    - 车牌号<br>    - 行驶里程<br>    - 行程时长<br>    - 平均车速<br>    - 最高车速<br>    - 最低车速<br>    - 起点<br>    - 终点<br>- 行驶轨迹<br>    - 地图展示轨迹（起点→终点，轨迹路径）<br>    - 支持放大缩小、拖拽地图<br>- 页面布局<br>    - 左侧展示字段信息<br>    - 右侧展示行驶轨迹||

### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|行程记录列表|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||选择时间|日期选择器|- 格式YYYY\-MM\-DD<br>- 需选择起止时间|- 行程时间命中选择的时间范围|

## 维修管理（定制）

### 功能描述：

在此描述

### 使用场景：

在此描述

### 功能流程：

在此上图

### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OGM2MWI2YTU0NTI3MjAxYjJhMWUyMGY1N2NjYzE1ZWZfOGQwNjlkNTZiZmYwMjMzNzA4MWFmZTRhN2IyYTlmMjBfSUQ6NzY0OTY5Mzc4MDg5NTIwNjYxOF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTJhZTU4ZWMzOTE5ZGIwYmM4ZmFlZTdhMDQ3Zjg5OTJfY2EyZTY2NTM5Nzg2M2ExMzBmYzlmNDdjZGUzOWUxYWFfSUQ6NzY0OTY5Mzg5NDUyODc0ODQ5Ml8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTA4MTY0MDQwYWIwMDRkOTgyMTEyMTczMWE3Y2JmYzdfMTQ0ZjQzYjE3NDgyNzY5ZmNjYjZjYWRiMGEwMjExMjFfSUQ6NzY0OTY5Mzk0NjA2Nzc0OTgxOV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|维修记录<br>|- 数据来源<br>    - 在故障报警、电池报警点击【一键报修】<br>    - 在维修记录中新建维修<br>- 列表字段<br>    - VIN码<br>    - 车牌号<br>    - 维修类型<br>        - 故障类<br>        - 电池类<br>    - 维修描述：取对应的报警类型<br>    - 开始时间：生成维修记录的时间<br>    - 结束时间：点击【完成维修】的时间<br>    - 操作人：取最近操作的操作人<br>    - 维修状态<br>        - 维修中<br>        - 维修完成<br>- 操作按钮<br>    - 新建维修<br>    - 删除记录：删除后状态回退<br>    - 完成维修||
|新建维修|- 填写表单<br>    - 维修车辆：选择维修车辆<br>    - 维修类型：选择维修类型<br>        - 故障类<br>        - 电池类<br>    - 维修描述：选择报警类型，单选<br>- 提交<br>    - **数****据校验**：点击【提交】时，全局校验所有必填项是否合规。校验不通过则在对应字段下方飘红提示。<br>        **成功反馈**：校验通过后调用服务端接口创建记录。成功弹窗关闭，列表自动刷新，顶部 Toast 提示“新建维修记录成功”。<br>- 取消||

### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|维修记录列表|车牌号|文本输入框|- 最多8个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||维修类型|下拉选择|- 单选<br>- 枚举值：全部、故障类、电池类||
||维修状态|下拉选择|- 单选<br>- 枚举值：全部、维修中、已完成||
||选择时间|日期选择器|- 格式YYYY\-MM\-DD<br>- 需选择起止时间|- 维修时间命中选择的时间范围|

## 实时监控（基线）

### 实时位置

#### 功能描述：

查看车辆位置信息

#### 使用场景：

查看车辆的位置分布

#### 功能流程：

无需

#### 页面原型：

在此上图

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NGYzYjg5MjQ0MTI3NDJiNmNlYjk2Y2VkNTg1Mzc2ZDRfZWUwMTY5ZjQ1MzU3ZWQ1NTllMDdhOWIwNjVlZGU3MDNfSUQ6NzY0NjMzNDM4MjM4ODcyNjk5M18xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|实时位置<br>|- 页面布局<br>    - 左侧展示车辆列表及筛选项<br>    - 右侧地图展示车辆位置<br>- 功能逻辑<br>    - 组织层级展示：支持按照企业层级展示企业名称、所属车辆数量、所属车辆列表<br>    - 多选联动：企业、车辆均支持多选。选中车辆后，地图区域会动态展示所选车辆的实时位置（地图打点并展示车牌号）<br>    - 企业、车辆支持多选<br>        - 选择企业，则一键全选该企业下全部车辆<br>- 车辆列表字段<br>    - 车辆 VIN：作为车辆的唯一标识展示在列表中 <br>    - 车辆状态：展示车辆当前的“在线”或“离线”状态，该状态是依据车辆绑定的设备在线/离线状态来判断的<br>- 地图<br>    - 地图比例拉到最大时，定时分批刷新车辆数据，具体逻辑实现参照安驾宝<br>    - 选中车辆后在地图中展示车辆位置；车辆位置用ICON标识，同时需展示车牌号<br>    - 车辆数量展示根据地图缩放做聚合处理<br>    - 点击车辆展示车辆详情信息<br>        - 车辆VIN、车牌号<br>        - 企业名称：车辆所属的企业名称<br>        - 设备名称：展示最新上报数据所属的设备名称<br>        - 设备状态：在线/离线；展示最新上报数据所属的设备状态<br>        - 当前车速：展示数据刷新时的车辆时速；单位km/h<br>        - 数据上报时间：格式：年\-月\-日 时:分:秒<br>    - 地图需支持缩放、拖动||

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|实时位置|企业名称/VIN码|文本输入|- 最多20个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|

### 轨迹回放

#### 功能描述：

支持按天查看车辆轨迹

#### 使用场景：

查看某车辆的某时间的车辆轨迹

#### 功能流程：

无

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OWViMzRmNmIwZGE5MzAyNTVmOGViNjg0ZDQyMWJlNzZfY2EyZTU3OWNjN2FkOGQwNThjY2ZhYzY1MzIzY2ZlNDlfSUQ6NzY0NjMzNDM4MzEyOTM5ODIxOV8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑

|功能名称|功能逻辑|交互说明|
|---|---|---|
|轨迹回放<br>|- 页面布局<br>    - 左侧展示车辆列表<br>    - 右上方地图展示轨迹<br>    - 右下方展示该车辆行程记录列表<br>- 功能逻辑<br>    - 按照企业层级展示企业名称、所属车辆数量、所属车辆列表<br>    - 仅支持单选车辆<br>    - 不支持选择企业<br>- 车辆列表字段<br>    - VIN码<br>    - 车辆状态<br>        - 在线/离线；车辆在线/离线逻辑依据关联设备在线/离线状态判断；<br>        - 若关联多个设备，则按照关联时间最早的设备状态来判断车辆状态<br>- 轨迹展示<br>    - 地图上展示起点、终点、轨迹路径，地图需支持拖动、缩放<br>    - 轨迹播放支持倍速：1/2/4/8倍<br>    - 默认展示当前的全部轨迹，以初始启动车辆移动为起点、最终熄火车辆静止为终点<br>- 行程记录列表<br>    - 行程定义：车辆（设备）超过10分钟未上报定位数据则视为行程结束，若否则属于行程中<br>    - 列表字段<br>        - 开始位置：展示车辆行程的起点地址；点击「查看」再解析展示详细地址<br>        - 结束位置：展示车辆行程的起点地址；点击「查看」再解析展示详细地址<br>        - 开始时间：展示行程的开始时间；格式：年\-月\-日 时:分:秒<br>        - 结束时间：展示行程的开始时间；格式：年\-月\-日 时:分:秒<br>        - 行驶时常：展示行程的持续时长；格式：时\-分\-秒<br>        - 行驶里程：展示行程行驶里程；单位km||

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|实时位置|企业名称/VIN码|文本输入|- 最多20个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
|轨迹回放|企业名称/VIN码|文本输入|- 最多20个字符<br>- 支持输入汉字、字母、数字|- 模糊匹配|
||选择时间|日期选择器|- 格式YYYY\-MM\-DD<br>- 需选择起止时间|- 记录时间命中选择的时间范围|

## 车辆数据

### 车辆信号数据

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZTg2N2JlMGY3ZDA3NjQwZDQ1MGJjZGJhNjM3ZTI4ODlfOGZjOTVlZWU0NTkwZGJkMjAzYWE2NzQ5YTRjODdkMjhfSUQ6NzY0OTY4ODMxNjE0OTg2MTU3NF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑：

### 数据导出记录

#### 页面原型：

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NzI2Yzc3M2JjMTcwMDIwNDE2NWQyNjJjY2Y4MmE4MGZfNjA3NTNkZTJkNmMxODU1MWExMWY1MGNkODY4ODc0NThfSUQ6NzY0OTY4ODM2NjM4MDg3ODc5MF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

#### 功能逻辑：

## 系统管理（基线）

### 用户管理

#### 页面原型

用户管理

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OGQ4YjUyNmViODMwMjEwNjhkYjgzNjA2MzFkYTQwYmFfODRjMmM3Zjk5YjUxMDk3YjM1ZDEzODY5MzQxYzM0YjNfSUQ6NzY0NjMzNTY3Njc0OTY0NjgwNl8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)



新增用户

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZmY0ODcyNzM1Yzk4OTk5MWY5OTY3MmYwOWQxMjk3MjJfNmM1ZjA4YjQ5MjQ1ZTAyMjQ2YWE0MTA5NDM2M2Q1MjZfSUQ6NzY0NjMzNTY3NTkxOTQwNDAwNl8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OWIyZTQ4ZTcyNWJiZWI2ZDhmNGYyNmMxMTY2NjFlOWZfNmRlM2E5ZDRiYzNkYTIwNDFhYjRlZjBjYmRkOWIyMmJfSUQ6NzY0NjMzNTY3NTM1NzQxNjY1NV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YzgxYzQ1MDhkZjRmODE3MThlZDE2OWZiMDdjMzY0YmJfNjg3ZDA0NTYzNjg0OTViNTEzMjE2ODUzODM2N2RmZDNfSUQ6NzY0NjMzNTY3NTQ1ODMwOTM0MV8xNzgxNTgwMDM0OjE3ODE2NjY0MzRfVjM)



#### 功能逻辑

用户管理

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：新增用户|1、点击新增用户按钮，页面跳转至新增用户页面。||
|2：用户列表展示|1、根据根据登录用户所在的租户层级，查询该租户下创建的用户信息。<br>2、列表展示字段<br>1）序号：默认按行，从1\~10，根据每页展示的条数展示。<br>2）用户昵称、登录邮箱、角色，根据用户内容展示。角色存在多个时用、号分开展示。<br>3）创建时间：展示用户信息创建入库的时间。<br>4）操作列：重置密码、编辑、删除<br>2、列表默认展示顺序，创建时间倒序，最近创建的最前面展示。默认每页10条。<br>3、分页条数：10、20、50、100条每页。||
|3：重置密码|1、点击重置密码，弹出二次确认弹窗，点击确认后，关闭该弹窗，调用服务端将该账号密码重置。<br>2、并弹出已重置密码的信息弹窗，展示用户昵称、登录邮箱、新密码信息。<br>1）新密码规则同账号创建初始密码规则，大写字母和数字组成8为随机字符。<br>3、复制信息：点击后，将登录邮箱，新密码复制到系统粘贴板上，并toast提示：复制成功<br>4、点击关闭，关闭弹窗。||
|3：编辑用户|1、点击编辑用户，弹出编辑用户弹窗。<br>2、回显当前用户信息，用户昵称、登录邮箱、角色信息。<br>3、用户信息更改后，点击确定，校验登录邮箱是否已被其他用户使用，如果已使用，输入框下飘红提示。如果未使用调用服务端保存用户信息。<br>4、该级租户下某用户为管理员角色，则角色信息置灰不可更改。||
|4：删除用户|1、点击删除用户按钮，弹出删除用户二次确认弹窗，点击确定，调用服务端删除用户，仅删除该用户在该租户下的对应角色权限关系。如果该用户同时存在该应用下其他租户用户，其他租户下的用户不影响。<br>2、该级租户下管理员角色的账号不可删除。||
|5：查询用户|1、查询条件<br>1）用户昵称：模糊查询，输入框支持输入文本，长度不限制。<br>2）登录邮箱：模糊查询，输入框支持文本输入，长度不限。<br>3）角色：多选下拉框，支持模糊查询，数据来源，已选租户下创建的角色数据。<br>4）创建时间：日期区间选择组件，无默认日期区间展示，由用户选择。<br>2、点击查询，调用服务端查询用户列表，列表渲染同时满足多项查询条件的用户信息。<br>3、点击重置，清空已选择的查询条件，列表按默认条件渲染数据。||

新增用户

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：创建账号（第一步）|1、创建账号<br>1）用户昵称：支持文本输入，长度20个字符，必填，不做唯一性校验，可重复。<br>2）登录邮箱：支持输入英文、数字、特殊字符，必填，做常规邮箱格式校验，不符合邮箱格式，输入框下飘红是提示，请输入正确格式的邮箱。<br>3）角色：多选下拉框支持模糊查询，必选，数据来源，对应租户下创建的角色数据。<br>3、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户，根据不同情况进入第二步。<br>4、点击返回，返回到用户管理列表页。||
|1：创建账号（第二步，账号不存在）|1、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户。<br>2、当前用户中心不存在该邮箱创建的用户时，以登录邮箱为唯一表示，在用户中心创建用户，并建立应用下对应租户下数据的关联关系。<br>1）用户ID：根据系统ID生成规则生成<br>2）登录邮箱：为用户第一步创建时填写的邮箱信息。<br>3）初始密码：使用大写英文字母和数字，生产8位的随机字符。<br>并赋予该用户到该租户下已选角色的相关权限。<br>3、复制信息：点击后，将登录邮箱，初始密码复制到系统粘贴板上，并toast提示：复制成功<br>4、点击完成：页面调整至用户列表。||
|1：创建账号（第二步，账号已存在）|1、点击下一步，根据登录邮箱作为唯一标识，调用服务端查询当前用户中心用户是否已存在相关用户。<br>2、当前用户中心已存在该邮箱创建的用户时，页面展示已存在的用户信息，展示用户ID、登录邮箱、用户昵称<br>3、复制信息：点击后，将登录邮箱、用户昵称复制到系统粘贴板上，并toast提示：复制成功<br>4、使用该账号创建，在当前用户角色的基础上，添加第一步已选对应租户下角色信息，已存在的不做添加。<br>5、点击上一步，返回到第一步，点击完成，页面调整至用户列表。||

### 角色管理

#### 页面原型

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=Y2QzY2ZiYjMyM2FjMzA1OTMxNjljMGU3MTUwOGRmNGJfMzFiNjRlNDJjZTk4YjE5M2ZiOWMxYzY5ZDJkYzZlYWZfSUQ6NzY0NjMzNTY3NjgzODI2NzgzNF8xNzgxNTgwMDM1OjE3ODE2NjY0MzVfVjM)



#### 功能逻辑

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|1：角色列表展示|1、根据登录用户所在的租户层级，查询该租户下创建的角色信息。<br>2、角色信息按创建时间正序展示，最新创建的在最下方展示。<br>3、管理员：上级租户创建本季租户，开通管理员账号时，系统自动在该租户的角色管理中创建管理员角色。功能权限为租户层级中对应的租户权限信息，数据权限默认为全部下级租户。<br>1）该管理员角色不支持编辑，删除，修改功能权限和数据权限。<br>4、鼠标移入角色，显示编辑、删除图标。点击角色右侧展示该角色的功能权限和数据权限信息。||
|2：新增角色|1、点击新增角色按钮，在下方展示新增角色输入框，角色名称，支持输入文本，长度10个字符，与该租户下已存在的角色做唯一性校验，点击对号，保存角色，角色名称重复，输入框下飘红提示，角色已存在。<br>2、权限配置<br>1）点击右侧功能权限，编辑，进入编辑状态，功能权限范围，为该租户层级下可配置的权限范围。<br>2）数据权限，默认全部下级租户。||
|3：删除角色|点击删除角色，弹出二次确认弹窗：<br>如果该角色未关联用户，二次确认弹窗，提示：删除后数据无法恢复，是否继续？<br>如果该角色已被用户关联使用，二次确认弹窗，提示：该角色已关联用户，删除后用户无相关权限，是否继续？<br>点击确认调用服务端执行角色删除，点击取消，关闭该弹窗。||
|【5月18日】针对租户管理员角色，账号同步规则汇总|租户创建后，同步租户管理员角色到该租户的角色管理中。<br>租户管理中设置管理员账号时，角色默认固定不可选，为初始化的管理员。<br>租户设置管理员账号后，同步该该租户的管理员账号到该租户的用户管理中。<br>角色管理，管理员角色不可删除，不可配置功能权限，仅可查看。<br>用户管理中，同步过来的租户管理员账号，不可删除。编辑时，不可修改角色，角色框置灰。<br>用户管理中，新增其他用户时，选择角色，不可选择同步过来的管理员角色，该选择置灰不可选择。||

### 日志审计

#### 功能描述：

日志审计模块用于记录平台内所有用户的关键配置与业务操作行为，满足海外合规及安全审计要求。系统在用户执行关键操作时自动写入一条审计日志，提供多维筛选与详情查看能力，日志数据至少保留 180 天。

#### 使用场景：

- **安全合规审计**：追溯用户在指定时间段内的所有操作行为，满足海外数据合规审查要求。

- **事故回溯**：当发生数据异常或配置错误时，通过操作日志定位具体操作人、操作时间及操作内容。

- **权限越权排查**：对比用户角色权限与实际操作，发现潜在越权行为

#### 功能流程：

无

#### 页面原型

#### 功能逻辑

|**功能名称**|**功能逻辑**|**原型**|
|---|---|---|
|日志列表<br>|- 列表字段<br>    - 序号<br>    - 操作时间：生成日志记录的时间<br>    - 操作人：执行操作的用户昵称<br>    - 操作账号：执行操作的登录邮箱<br>    - 所属租户：操作人当前生效的租户名称<br>    - 操作菜单：操作归属的功能模块，一级菜单\-二级菜单路径<br>    - 操作功能：具象操作名称<br>    - 操作内容：按模板拼装的可读描述<br>    - 操作结果：成功/失败<br>- 排序及分页<br>    - 按日志记录时间倒序排列<br>    - 分页默认20条，支持10/20/50/100||
|日志审计数据规则|- 操作菜单<br>    - 仅展示操作的一级菜单||

#### 日志审计数据映射表

|序号|操作菜单|操作功能|操作内容|
|---|---|---|---|
|1|账户|登录|登录系统|
|2|账户|退出|退出系统|
|3|账户|修改密码|修改密码|
|4|账户|重置密码|重置用户【被重置用户邮箱】的密码|
|5|业务管理|新增租户层级|新增租户层级【层级名称】|
|6|业务管理|编辑租户层级|编辑租户层级【原名称】为【新名称】|
|7|业务管理|删除租户层级|删除租户层级【层级名称】|
|8|业务管理|配置功能权限|配置【层级名称】的功能权限|
|9|业务管理|同步资产|执行资产同步|
|10|业务管理|资产划拨|将车辆【脱敏VIN】从【划拨前租户名称】划拨至【划拨后租户名称】|
|11|业务管理|批量资产划拨|批量资产划拨：将【N】辆车划拨至【划拨后租户名称】|
|12|业务管理|删除资产|删除车辆资产【脱敏VIN】|
|13|业务管理|新增用户|新增用户【用户邮箱】，分配角色【角色列表】|
|14|业务管理|编辑用户|编辑用户【用户邮箱】信息|
|15|业务管理|删除用户|删除用户【用户邮箱】|
|16|业务管理|重置密码|重置用户【用户邮箱】的密码|
|17|业务管理|新增角色|新增角色【角色名称】|
|18|业务管理|编辑角色|编辑角色【角色名称】|
|19|业务管理|删除角色|删除角色【角色名称】|
|20|业务管理|编辑功能权限|编辑角色【角色名称】的功能权限|
|22|租户管理|新增租户|新增租户【租户名称】|
|23|租户管理|编辑租户|编辑租户【租户名称】信息|
|24|租户管理|删除租户|删除租户【租户名称】|
|25|租户管理|开通主账号|为租户【租户名称】开通主账号【账号邮箱】|
|26|车辆管理|批量导入|批量导入车辆信息：成功【N】条，失败【M】条|
|27|围栏管理|新建围栏|新建围栏【围栏名称】，类型【围栏类型】，预警【预警类型】|
|28|围栏管理|编辑围栏|编辑围栏【围栏名称】|
|29|围栏管理|删除围栏|删除围栏【围栏名称】|
|30|围栏管理|启用围栏|启用围栏【围栏名称】|
|31|围栏管理|停用围栏|停用围栏【围栏名称】|
|32|围栏管理|添加车辆|为围栏【围栏名称】添加车辆【脱敏VIN】|
|33|围栏管理|删除车辆|从围栏【围栏名称】移除车辆【脱敏VIN】|
|34|风控预警|一键报修|一键报修（故障类）：车辆【脱敏VIN】，报警类型【报警类型】|
|35|风控预警|一键报修|一键报修（电池类）：车辆【脱敏VIN】，报警类型【报警类型】|
|36|维修管理|新建维修|新建维修记录：车辆【脱敏VIN】，类型【维修类型】|
|37|维修管理|完成维修|标记维修完成：车辆【脱敏VIN】，类型【维修类型】|
|38|维修管理|编辑维修|编辑维修记录：车辆【脱敏VIN】|
|39|维修管理|删除维修|删除维修记录：车辆【脱敏VIN】，类型【维修类型】|
|40|系统管理|新增用户|新增用户【用户邮箱】，分配角色【角色列表】|
|41|系统管理|编辑用户|编辑用户【用户邮箱】信息|
|42|系统管理|删除用户|删除用户【用户邮箱】|
|43|系统管理|重置密码|重置用户【用户邮箱】的密码|
|44|系统管理|新增角色|新增角色【角色名称】|
|45|系统管理|编辑角色|编辑角色【角色名称】|
|46|系统管理|删除角色|删除角色【角色名称】|
|47|系统管理|编辑功能权限|编辑角色【角色名称】的功能权限|
|48|车辆数据|导出车辆信号数据|导出车辆【脱敏VIN】信号数据|
|49|车辆数据|下载导出文件|下载导出文件【文件名】|

#### 搜索筛选项字段约束

|页面|检索字段|输入方式|输入限制|匹配规则|
|---|---|---|---|---|
|操作日志列表|操作人|文本输入框|- 最多 50 个字符，支持模糊查询|- 模糊匹配|
||操作账号|文本输入框|- 最多 50 个字符，支持模糊查询|- 模糊匹配|
||所属租户|下拉选择框|- 枚举值：当前应用下所有租户名称，附加「全部」选项；默认「全部」|- 精确匹配<br>- 单选|
||操作菜单|下拉选择框|- 枚举值：加载平台全部一级菜单，附加「全部」选项；默认「全部」|- 精确匹配<br>- 多选|
||操作功能|下拉选择框|- 枚举值根据系统内所有操作功能自动加载；若已选「操作菜单」，则仅展示该菜单下的功能|- 精确匹配所选功能<br>- 多选|
||操作时间范围|双日期时间选择器|- 起止时间跨度最长 180 天；仅可查询过去 180 天内的数据；默认展示近 7 天|- 操作时间命中所选区间|
||操作结果|下拉选择框|- 枚举值：全部、成功、失败；默认「全部」|- 精确匹配<br>- 单选|

# 



