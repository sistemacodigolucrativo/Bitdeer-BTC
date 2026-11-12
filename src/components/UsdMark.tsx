import React,{ReactNode} from 'react';

type UsdMarkProps={className?:string;title?:string};

/** Responsive visual currency mark. Monetary values and their calculations remain unchanged. */
export const UsdMark:React.FC<UsdMarkProps>=({className='',title='USD'})=><img
  src="/assets/usd-mark.png"
  alt={title}
  title={title}
  className={'inline-block h-[1em] w-[1em] max-h-full min-w-[0.9em] shrink-0 object-contain align-[-0.15em] '+className}
/>;

export const UsdAmount:React.FC<{children:ReactNode;className?:string}>=({children,className=''})=><span className={'inline-flex max-w-full min-w-0 items-baseline gap-[0.3em] align-middle '+className}>
  <UsdMark/><span className="min-w-0">{children}</span>
</span>;
