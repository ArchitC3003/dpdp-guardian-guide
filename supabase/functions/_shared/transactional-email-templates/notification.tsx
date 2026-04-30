/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'PrivcybHub'
const SITE_URL = 'https://www.privcybhub.com'

interface NotificationProps {
  name?: string
  title?: string
  message?: string
  actionUrl?: string
  actionLabel?: string
}

const NotificationEmail = ({
  name, title, message, actionUrl, actionLabel,
}: NotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || `Update from ${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{title || `Update from ${SITE_NAME}`}</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hello,'}
        </Text>
        <Text style={text}>
          {message || 'You have a new update on your PrivcybHub workspace.'}
        </Text>
        {actionUrl && (
          <Button style={button} href={actionUrl}>
            {actionLabel || 'View Details'}
          </Button>
        )}
        <Text style={footer}>— The {SITE_NAME} Team · {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NotificationEmail,
  subject: (data: Record<string, any>) =>
    typeof data.title === 'string' && data.title ? data.title : `Update from ${SITE_NAME}`,
  displayName: 'General notification',
  previewData: {
    name: 'Aarav',
    title: 'Your assessment report is ready',
    message: 'The Phase 6 dashboard for your DPDP assessment has been generated.',
    actionUrl: 'https://www.privcybhub.com/dashboard',
    actionLabel: 'Open Dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.5', margin: '0 0 25px' }
const button = {
  backgroundColor: '#059669', color: '#ffffff', fontSize: '14px',
  borderRadius: '8px', padding: '12px 20px', textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#64748b', margin: '30px 0 0' }