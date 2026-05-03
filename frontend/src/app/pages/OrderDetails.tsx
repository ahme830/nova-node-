import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, MapPin, CreditCard, ShieldCheck, Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/badge';
import { motion } from 'framer-motion';
import { commandeService } from '../../services/commande.service';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusColors: Record<string, string> = {
  en_cours: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  acceptee: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  completer: 'bg-green-500/20 text-green-400 border-green-500/30',
  annulee: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const getStatusLabel = (status: string, t: any) => {
  return t(`customerDashboard.status.${status}`) || status;
};

export function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleDownloadInvoice = () => {
    if (!order) return;

    const doc = new jsPDF();
    const primaryColor = [139, 92, 246]; // #8b5cf6
    
    // Header - Modern Design
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('NEXUS', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM MARKETPLACE', 20, 32);
    
    doc.setTextColor(255, 255, 255);
    doc.text(`FACTURE #${order.id.substring(0, 8).toUpperCase()}`, 190, 25, { align: 'right' });

    // Reset Text Color
    doc.setTextColor(60, 60, 60);
    
    // Client & Order Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DESTINATAIRE', 20, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${order.utilisateur?.nom || order.utilisateur?.email || 'Client'}`, 20, 67);
    doc.text(`${order.adresse?.rue || ''} ${order.adresse?.numero || ''}`, 20, 72);
    doc.text(`${order.adresse?.code_postal || ''} ${order.adresse?.ville || ''}, ${order.adresse?.pays || ''}`, 20, 77);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DÉTAILS COMMANDE', 130, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(order.date_commande).toLocaleDateString(i18n.language)}`, 130, 67);
    doc.text(`Statut: ${getStatusLabel(order.statut_commande, t)}`, 130, 72);
    doc.text(`ID: ${order.id}`, 130, 77);

    // Items Table
    const tableData = order.ligne_commande.map((item: any) => [
      item.produit?.nom_produit || 'Module Technologique',
      item.qte.toString(),
      parseFloat(item.prix_at_time).toLocaleString(i18n.language) + ' DZD',
      (parseFloat(item.prix_at_time) * item.qte).toLocaleString(i18n.language) + ' DZD'
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['MODULE', 'QUANTITÉ', 'PRIX UNITAIRE', 'TOTAL']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: primaryColor as [number, number, number], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      styles: { font: 'helvetica', fontSize: 9 }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(10);
    doc.text('Sous-total:', 140, finalY + 10);
    doc.text(`${(parseFloat(order.montant_total) * 0.81).toLocaleString(i18n.language)} DZD`, 190, finalY + 10, { align: 'right' });
    
    doc.text('TVA (19%):', 140, finalY + 17);
    doc.text(`${(parseFloat(order.montant_total) * 0.19).toLocaleString(i18n.language)} DZD`, 190, finalY + 17, { align: 'right' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(130, finalY + 22, 200, finalY + 22);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246);
    doc.text('TOTAL:', 140, finalY + 32);
    doc.text(`${parseFloat(order.montant_total).toLocaleString(i18n.language)} DZD`, 190, finalY + 32, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Merci de votre confiance en l\'écosystème NEXUS.', 105, 280, { align: 'center' });
    doc.text('Document généré numériquement - Certifié Nexus Prime.', 105, 285, { align: 'center' });

    // Download
    doc.save(`Facture_NEXUS_${order.id.substring(0, 8).toUpperCase()}.pdf`);
    toast.success(t('orderDetails.invoicePdf') + ' ' + t('common.done', 'Générée'));
  };

  const backPath = user?.role === 'vendor' ? '/vendor/orders' : '/customer/orders';

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const res = await commandeService.getById(id);
        setOrder(res.commande);
      } catch (err) {
        console.error('Order details load error:', err);
        toast.error(t('customerOrders.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">{t('common.notFound')}</h2>
        <Button onClick={() => navigate(backPath)}>{t('orderDetails.backToHistory')}</Button>
      </div>
    );
  }

  const steps = [
    { title: t('orderDetails.step1'), date: new Date(order.date_commande).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), done: true },
    { title: t('orderDetails.step2'), date: order.statut_commande !== 'en_cours' ? t('common.done') || 'Terminé' : t('orderDetails.awaiting'), done: order.statut_commande !== 'en_cours' },
    { title: t('orderDetails.step3'), date: order.statut_commande === 'completer' ? t('common.done') || 'Terminé' : t('orderDetails.awaiting'), done: order.statut_commande === 'completer' },
    { title: t('orderDetails.step4'), date: order.statut_commande === 'completer' ? t('common.done') || 'Terminé' : t('orderDetails.awaiting'), done: order.statut_commande === 'completer' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <Button 
              variant="ghost" 
              className="mb-4 -ml-4 hover:bg-muted dark:bg-white/5 opacity-70"
              onClick={() => navigate(backPath)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('orderDetails.backToHistory')}
            </Button>
            <div className="flex items-center gap-3 text-primary mb-2">
              <span className="text-sm tracking-[0.3em] uppercase opacity-70">{t('orderDetails.flowReport')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">#{order.id.substring(0, 8)}</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="glass" size="lg" className="hidden sm:flex">
              <Printer className="w-5 h-5 mr-3" />
              {t('orderDetails.printTicket')}
            </Button>
            <Button variant="glow" size="lg" onClick={handleDownloadInvoice}>
              <Download className="w-5 h-5 mr-3" />
              {t('orderDetails.invoicePdf')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Order Items */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-6 sm:p-8 shadow-soft">
              <h2 className="text-xl sm:text-2xl font-bold mb-8">{t('orderDetails.includedModules')}</h2>
              <div className="space-y-6">
                {order.ligne_commande?.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl hover:bg-muted dark:bg-white/5 transition-colors border border-transparent hover:border-border group">
                    <div className="w-full sm:w-24 h-48 sm:h-24 rounded-2xl overflow-hidden border border-border shrink-0">
                      <img src={item.produit?.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200'} alt={item.produit?.nom_produit} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg sm:text-xl font-bold group-hover:text-primary transition-colors">{item.produit?.nom_produit}</h3>
                        <p className="text-xl font-black tabular-nums">{(parseFloat(item.prix_at_time) * item.qte).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{t('orderDetails.quantity')}: {item.qte}</span>
                        <span>•</span>
                        <span>{t('orderDetails.unit')}: {parseFloat(item.prix_at_time).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline / Progress */}
            <div className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-6 sm:p-8 shadow-soft">
              <h2 className="text-xl sm:text-2xl font-bold mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                {t('orderDetails.timelineTitle')}
              </h2>
              <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {steps.map((item, i) => (
                  <div key={i} className={`relative pl-10 ${item.done ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-background z-10 ${
                      item.done ? 'bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-muted'
                    }`}></div>
                    <h3 className={`font-bold ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Status & Info */}
          <div className="space-y-8">
            <div className="bg-card/30 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-soft">
              <Badge className={`${statusColors[order.statut_commande] || 'bg-gray-500/20 text-gray-400'} border uppercase tracking-widest text-xs px-6 py-3 rounded-full mb-8 w-full justify-center`}>
                {getStatusLabel(order.statut_commande, t)}
              </Badge>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {t('orderDetails.shippingPoint')}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/90 font-bold">
                    {order.utilisateur?.nom || order.utilisateur?.email || t('product.unknown')}<br />
                    {order.adresse?.rue} {order.adresse?.numero || ''}<br />
                    {order.adresse?.code_postal} {order.adresse?.ville}, {order.adresse?.pays}
                  </p>
                </div>

                <div className="h-px bg-border"></div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                    <CreditCard className="w-3 h-3" />
                    {t('orderDetails.paymentProtocol')}
                  </h3>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-bold uppercase">{order.methode_paiement || t('checkout.payment.cash')}</p>
                      <p className="text-xs text-muted-foreground italic">{t('orderDetails.authorization')}: OK-TX{order.id.substring(0, 4).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border"></div>

                 <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('orderDetails.subtotal')}</span>
                    <span className="tabular-nums">{(parseFloat(order.montant_total) * 0.81).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('orderDetails.logistics')}</span>
                    <span className="tabular-nums">{(0).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t('orderDetails.tax')}</span>
                    <span className="tabular-nums">{(parseFloat(order.montant_total) * 0.19).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-primary pt-4 border-t border-border mt-4">
                    <span>{t('orderDetails.total')}</span>
                    <span className="tabular-nums">{parseFloat(order.montant_total).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-soft">
              <p className="text-[10px] text-primary leading-relaxed uppercase tracking-widest font-bold mb-4">{t('orderDetails.needHelp')}</p>
              <Button variant="ghost" className="w-full hover:bg-primary/10 hover:text-primary transition-all text-xs border border-primary/20 h-10 rounded-xl" onClick={() => navigate('/contact')}>
                {t('orderDetails.reportBug')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

