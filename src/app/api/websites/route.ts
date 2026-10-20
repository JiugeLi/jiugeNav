import { getDb, getUserId, unauthorized, dbUnavailable, serverError, badRequest } from '@/lib/api';
import { normalizeUrl } from '@/lib/url';
import { groups, websites } from '@/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

