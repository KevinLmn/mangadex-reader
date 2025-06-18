'use client';

import Link from 'next/link';
import React from 'react';
import { usePaginationRange } from '../hooks/usePaginationRange';
import { Button } from './Button';

type PaginationMode = 'link' | 'button';

interface BasePaginationProps {
  totalPages: number;
  page: number;
  mode: PaginationMode;
}

interface LinkPaginationProps extends BasePaginationProps {
  mode: 'link';
  hrefBuilder: (page: number) => string;
}

interface ButtonPaginationProps extends BasePaginationProps {
  mode: 'button';
  onPageChange: (page: number) => void;
}

type PaginationProps = LinkPaginationProps | ButtonPaginationProps;

export const Pagination = (props: PaginationProps) => {
  const { totalPages, page, mode} = props;
  const range = usePaginationRange(totalPages, page);

  return (
    <div className="flex justify-center mt-8">
      <nav className="flex items-center space-x-1" aria-label="Pagination">
        {/* Previous */}
        {page > 1 && (
          mode === 'link' ? (
            <Link href={props.hrefBuilder(page - 1)}>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0"><ChevronLeftIcon /></Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => props.onPageChange(page - 1)}><ChevronLeftIcon /></Button>
          )
        )}

        {/* Page numbers */}
        {range.map((num, idx) =>
          typeof num === 'number' ? (
            mode === 'link' ? (
              <Link key={idx} href={props.hrefBuilder(num)}>
                <Button
                  variant={num === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {num}
                </Button>
              </Link>
            ) : (
              <Button
                key={idx}
                variant={num === page ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => props.onPageChange(num)}
              >
                {num}
              </Button>
            )
          ) : (
            <Button key={idx} variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
              {num}
            </Button>
          )
        )}

        {/* Next */}
        {page < totalPages && (
          mode === 'link' ? (
            <Link href={props.hrefBuilder(page + 1)}>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0"><ChevronRightIcon /></Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => props.onPageChange(page + 1)}>&gt;</Button>
          )
        )}
      </nav>
    </div>
  );
};

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
  
  const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );