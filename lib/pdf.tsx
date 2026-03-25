import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { IInvoice } from '@/models/Invoice';
import { IClient } from '@/models/Client';
import { IUser } from '@/models/User';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
  },
  businessInfo: {
    textAlign: 'right',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceMeta: {
    marginBottom: 30,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 80,
    color: '#666',
  },
  billTo: {
    marginBottom: 30,
  },
  billToTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#666',
    textTransform: 'uppercase',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  colDesc: { width: '60%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    textAlign: 'center',
    color: '#999',
  },
  notes: {
    marginTop: 20,
    fontSize: 9,
    color: '#666',
  }
});

const InvoiceDocument = ({ invoice, client, user }: { invoice: any, client: any, user: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          {user.businessLogo && <Image src={user.businessLogo} style={styles.logo} />}
        </View>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{user.businessName || user.name}</Text>
          <Text>{user.businessAddress}</Text>
          <Text>{user.email}</Text>
        </View>
      </View>

      <View style={styles.invoiceMeta}>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Invoice #:</Text>
          <Text>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Issue Date:</Text>
          <Text>{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Due Date:</Text>
          <Text>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Status:</Text>
          <Text style={{ textTransform: 'uppercase' }}>{invoice.status}</Text>
        </View>
      </View>

      <View style={styles.billTo}>
        <Text style={styles.billToTitle}>Bill To</Text>
        <Text style={{ fontWeight: 'bold' }}>{client.name}</Text>
        {client.company && <Text>{client.company}</Text>}
        <Text>{client.email}</Text>
        {client.taxId && <Text>Tax ID: {client.taxId}</Text>}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colPrice}>Unit Price</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {invoice.lineItems.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.colTotal}>{item.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalsTable}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{invoice.currency} {invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax ({invoice.taxRate}%)</Text>
              <Text>{invoice.currency} {invoice.taxAmount.toFixed(2)}</Text>
            </View>
          )}
          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{invoice.currency} {invoice.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>TOTAL</Text>
            <Text>{invoice.currency} {invoice.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {invoice.notes && (
        <View style={styles.notes}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes:</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
);

export async function generateInvoicePDF(invoice: IInvoice, client: IClient, user: IUser) {
  return await renderToBuffer(<InvoiceDocument invoice={invoice} client={client} user={user} />);
}
