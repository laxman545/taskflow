import React, { useState, useEffect } from 'react';
import { PrintingService, ServiceType, PaperSize, Language, Shop, StaffMember } from '../../types';
import {
  getShopServices,
  fetchShopServices,
  saveShopServices,
  addShopService,
  updateShopService,
  deleteShopService,
  DEFAULT_SERVICES
} from '../../utils/servicesStorage';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Calculator,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  DollarSign
} from 'lucide-react';

interface ServicesPricingViewProps {
  shop: Shop;
  lang: Language;
  currentUser?: StaffMember | null;
}

export const ServicesPricingView: React.FC<ServicesPricingViewProps> = ({
  shop,
  lang,
  currentUser,
}) => {
  const [services, setServices] = useState<PrintingService[]>(() => getShopServices(shop.id));
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<PrintingService | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | 'other'>('print');
  const [paperSize, setPaperSize] = useState<PaperSize | 'other'>('A4');
  const [isColor, setIsColor] = useState(false);
  const [unitPrice, setUnitPrice] = useState<number>(10);
  const [unitLabel, setUnitLabel] = useState('per page');
  const [description, setDescription] = useState('');

  // Sample calculator states
  const [calcPages, setCalcPages] = useState(25);
  const [calcCopies, setCalcCopies] = useState(1);
  const [calcSelectedServiceId, setCalcSelectedServiceId] = useState<string>(
    services[0]?.id || ''
  );

  const refreshServices = () => {
    setServices(getShopServices(shop.id));
  };

  useEffect(() => {
    fetchShopServices(shop.id)
      .then((srvs) => {
        if (srvs && srvs.length > 0) setServices(srvs);
      })
      .catch(() => {});
  }, [shop.id]);

  const openAddModal = () => {
    setName('');
    setServiceType('print');
    setPaperSize('A4');
    setIsColor(false);
    setUnitPrice(10);
    setUnitLabel('per page');
    setDescription('');
    setEditingService(null);
    setShowAddModal(true);
  };

  const openEditModal = (service: PrintingService) => {
    setEditingService(service);
    setName(service.name);
    setServiceType(service.service_type);
    setPaperSize(service.paper_size || 'A4');
    setIsColor(service.is_color || false);
    setUnitPrice(service.unit_price);
    setUnitLabel(service.unit_label);
    setDescription(service.description || '');
    setShowAddModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || unitPrice <= 0) return;

    if (editingService) {
      updateShopService(shop.id, editingService.id, {
        name: name.trim(),
        service_type: serviceType,
        paper_size: paperSize,
        is_color: isColor,
        unit_price: unitPrice,
        unit_label: unitLabel.trim(),
        description: description.trim() || undefined,
      });
    } else {
      addShopService(shop.id, {
        name: name.trim(),
        service_type: serviceType,
        paper_size: paperSize,
        is_color: isColor,
        unit_price: unitPrice,
        unit_label: unitLabel.trim(),
        is_active: true,
        description: description.trim() || undefined,
      });
    }

    refreshServices();
    setShowAddModal(false);
  };

  const handleToggleActive = (service: PrintingService) => {
    updateShopService(shop.id, service.id, { is_active: !service.is_active });
    refreshServices();
  };

  const handleDelete = (service: PrintingService) => {
    if (confirm(`Are you sure you want to remove "${service.name}"?`)) {
      deleteShopService(shop.id, service.id);
      refreshServices();
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset services to standard Nepal print shop defaults?')) {
      saveShopServices(shop.id, DEFAULT_SERVICES);
      refreshServices();
    }
  };

  // Live calculator calculation
  const calcSelectedService = services.find((s) => s.id === calcSelectedServiceId) || services[0];
  const calcTotalPrints = calcPages * calcCopies;
  const calcTotalAmount = (calcSelectedService?.unit_price || 0) * calcTotalPrints;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-900" />
              <span>Service & Pricing Configuration</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900">
              Owner Management
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure printing rates (A4 B/W, Color, A3, Photo Print, Binding). Automatic order value calculation applies to customer uploads
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Reset to default Nepal print market rates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Security & Access Restriction Callout (Requirement 5) */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
        <AlertCircle className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Owner Pricing Permission Rule:</span>
          <p className="text-indigo-900 mt-0.5 leading-relaxed">
            Prices configured here are strictly isolated to the Owner account. Staff accounts on counter PCs are restricted from accessing prices, customer billing amounts, and shop revenue
          </p>
        </div>
      </div>

      {/* Live Order Price Preview Calculator (Requirement 15) */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Live Order Price Calculator Simulator
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Automatically calculates orders at checkout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Select Service
            </label>
            <select
              value={calcSelectedServiceId}
              onChange={(e) => setCalcSelectedServiceId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-semibold focus:outline-none"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} (Rs. {srv.unit_price} {srv.unit_label})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Page / Sheet Count
            </label>
            <input
              type="number"
              min={1}
              value={calcPages}
              onChange={(e) => setCalcPages(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-300 font-semibold mb-1">
              Number of Copies
            </label>
            <input
              type="number"
              min={1}
              value={calcCopies}
              onChange={(e) => setCalcCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs font-bold focus:outline-none"
            />
          </div>

          <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex flex-col justify-center">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold">
              Calculated Value
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                Rs. {calcTotalAmount.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-300">
                ({calcTotalPrints} prints × Rs. {calcSelectedService?.unit_price || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Service Name</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Specs</th>
                <th className="py-3 px-4 font-bold">Unit Rate</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="space-y-0.5">
                      <span className="text-sm">{service.name}</span>
                      {service.description && (
                        <p className="text-[11px] text-slate-500 font-normal">{service.description}</p>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="capitalize font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {service.service_type.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {service.paper_size && (
                        <span className="font-mono bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                          {service.paper_size}
                        </span>
                      )}
                      {service.is_color !== undefined && (
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          service.is_color ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {service.is_color ? 'Color' : 'B/W'}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-base text-blue-950 whitespace-nowrap">
                    Rs. {service.unit_price}{' '}
                    <span className="text-[10px] text-slate-500 font-normal">
                      {service.unit_label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(service)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                        service.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {service.is_active ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(service)}
                        className="p-1.5 text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Price & Specs"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-900" />
                <span>{editingService ? 'Edit Printing Service' : 'Add New Printing Service'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. A4 Full Color High-Gloss Print"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType | 'other')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white"
                  >
                    <option value="print">Document Print</option>
                    <option value="photocopy">Photocopy / Xerox</option>
                    <option value="citizenship">Citizenship Print (नागरिकता)</option>
                    <option value="photo_print">Photo Print</option>
                    <option value="other">Other Finishing (Binding, Lamination)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paper Size
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value as PaperSize | 'other')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white"
                  >
                    <option value="A4">A4 (Standard 210×297mm)</option>
                    <option value="A5">A5 (Half Paper 148×210mm)</option>
                    <option value="A3">A3 (Large 297×420mm)</option>
                    <option value="other">Other / Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (Rs. NPR) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0.5}
                      step={0.5}
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold focus:bg-white font-mono"
                    />
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">Rs.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pricing Unit Label
                  </label>
                  <input
                    type="text"
                    required
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="e.g. per page, per photo"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isColor}
                    onChange={(e) => setIsColor(e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300"
                  />
                  <span>Full Color Print</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Details / Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paper weight, finish, or resolution details"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Service Price</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
