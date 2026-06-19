import type { TripDetail } from '@/types';
import { getFilteredVehicles } from './vehicles';

const tripData: TripDetail[] = [
  {
    id: 't1', vin: 'LJ8T7AD0000100000', plate: 'KLTX51',
    startTime: '2026-06-10 08:00', endTime: '2026-06-10 09:25',
    startLocation: '智利圣地亚哥首都大区圣地亚哥市阿乌马达步行街234号', endLocation: '智利瓦尔帕莱索大区瓦尔帕莱索港码头大道150号',
    distance: 115, duration: '01:25', avgSpeed: 81, maxSpeed: 95, minSpeed: 55,
    alerts: [
      { id: 'a1', type: '急加速', time: '2026-06-04 08:15' },
      { id: 'a2', type: '急减速', time: '2026-06-04 08:45' },
      { id: 'a3', type: '超速', time: '2026-06-04 09:00' },
    ],
    alertCount: 3,
  },
  {
    id: 't2', vin: 'LJ8T7AD0000100001', plate: 'BDFG78',
    startTime: '2026-05-28 07:30', endTime: '2026-05-28 10:10',
    startLocation: '智利圣地亚哥马伊普区工业大道5500号', endLocation: '智利圣地亚哥拉斯孔德斯区商业大道3200号',
    distance: 95, duration: '02:40', avgSpeed: 62, maxSpeed: 88, minSpeed: 40,
    alerts: [
      { id: 'b1', type: '急转弯', time: '2026-06-04 08:20' },
      { id: 'b2', type: '急加速', time: '2026-06-04 09:05' },
    ],
    alertCount: 2,
  },
  {
    id: 't3', vin: 'LJ8T7AD0000100002', plate: 'PRHM23',
    startTime: '2026-06-11 06:00', endTime: '2026-06-11 07:45',
    startLocation: '智利圣地亚哥普罗维登西亚区新普罗维登西亚街1050号', endLocation: '智利圣地亚哥首都大区阿图罗梅里诺贝尼特斯国际机场',
    distance: 88, duration: '01:45', avgSpeed: 73, maxSpeed: 92, minSpeed: 50,
    alerts: [],
    alertCount: 0,
  },
  {
    id: 't4', vin: 'LJ8T7AD0000100003', plate: 'SNWK91',
    startTime: '2026-05-25 09:00', endTime: '2026-05-25 12:30',
    startLocation: '智利圣地亚哥圣米格尔区大阿韦尼达街890号', endLocation: '智利奥伊金斯将军大区兰卡瓜市解放者大道901号',
    distance: 145, duration: '03:30', avgSpeed: 58, maxSpeed: 85, minSpeed: 35,
    alerts: [
      { id: 'd1', type: '疲劳驾驶', time: '2026-06-04 11:00' },
      { id: 'd2', type: '超速', time: '2026-06-04 10:30' },
      { id: 'd3', type: '急减速', time: '2026-06-04 09:45' },
    ],
    alertCount: 3,
  },
  {
    id: 't5', vin: 'LJ8T7AD0000100004', plate: 'LMCX44',
    startTime: '2026-06-12 10:00', endTime: '2026-06-12 11:20',
    startLocation: '智利瓦尔帕莱索大区比尼亚德尔马市海滨路789号', endLocation: '智利瓦尔帕莱索大区基略塔市中央大道345号',
    distance: 65, duration: '01:20', avgSpeed: 70, maxSpeed: 90, minSpeed: 45,
    alerts: [
      { id: 'e1', type: '急转弯', time: '2026-06-04 10:35' },
    ],
    alertCount: 1,
  },
  {
    id: 't6', vin: 'LJ8T7AD0000100005', plate: 'VTRJ67',
    startTime: '2026-06-09 05:30', endTime: '2026-06-09 08:00',
    startLocation: '智利圣地亚哥圣贝尔纳多市自由大道1200号', endLocation: '智利圣地亚哥梅利皮亚市港口路560号',
    distance: 120, duration: '02:30', avgSpeed: 65, maxSpeed: 82, minSpeed: 38,
    alerts: [
      { id: 'f1', type: '急加速', time: '2026-06-04 06:10' },
      { id: 'f2', type: '超速', time: '2026-06-04 07:00' },
      { id: 'f3', type: '急减速', time: '2026-06-04 07:30' },
      { id: 'f4', type: '疲劳驾驶', time: '2026-06-04 07:50' },
    ],
    alertCount: 4,
  },
  {
    id: 't7', vin: 'LJ8T7AD0000100006', plate: 'HZPY12',
    startTime: '2026-06-08 11:00', endTime: '2026-06-08 13:15',
    startLocation: '智利圣地亚哥普恩特阿尔托区南部大道4500号', endLocation: '智利圣地亚哥兰帕市北部公路2100号',
    distance: 105, duration: '02:15', avgSpeed: 75, maxSpeed: 96, minSpeed: 52,
    alerts: [],
    alertCount: 0,
  },
  {
    id: 't8', vin: 'LJ8T7AD0000100007', plate: 'QBNF85',
    startTime: '2026-06-07 08:30', endTime: '2026-06-07 11:45',
    startLocation: '智利圣地亚哥拉佛罗里达区瓦兰多街1780号', endLocation: '智利圣地亚哥科利纳市中央广场路680号',
    distance: 130, duration: '03:15', avgSpeed: 60, maxSpeed: 78, minSpeed: 30,
    alerts: [
      { id: 'h1', type: '急减速', time: '2026-06-04 09:15' },
    ],
    alertCount: 1,
  },
  {
    id: 't9', vin: 'LJ8T7AD0000100008', plate: 'DRLG33',
    startTime: '2026-06-11 12:00', endTime: '2026-06-11 14:00',
    startLocation: '智利圣地亚哥韦丘拉巴区改革大道3800号', endLocation: '智利圣地亚哥基利库拉市工业街1100号',
    distance: 55, duration: '02:00', avgSpeed: 55, maxSpeed: 80, minSpeed: 25,
    alerts: [
      { id: 'i1', type: '急加速', time: '2026-06-04 12:30' },
      { id: 'i2', type: '急转弯', time: '2026-06-04 13:00' },
      { id: 'i3', type: '超速', time: '2026-06-04 13:30' },
    ],
    alertCount: 3,
  },
  {
    id: 't10', vin: 'LJ8T7AD0000100009', plate: 'TWKC79',
    startTime: '2026-05-20 07:00', endTime: '2026-05-20 08:50',
    startLocation: '智利圣地亚哥中央火车站区解放者大道7200号', endLocation: '智利圣地亚哥普达韦尔市机场路4500号',
    distance: 78, duration: '01:50', avgSpeed: 68, maxSpeed: 86, minSpeed: 42,
    alerts: [
      { id: 'j1', type: '急减速', time: '2026-06-04 07:40' },
    ],
    alertCount: 1,
  },
];

export function getTripDetails(): TripDetail[] {
  const vins = new Set(getFilteredVehicles(false).map((v) => v.vin));
  return tripData.filter((t) => vins.has(t.vin));
}

export function getTripDetailById(id: string): TripDetail | undefined {
  return tripData.find((t) => t.id === id);
}
