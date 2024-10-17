USE [swpro]
GO

/****** Object:  Table [dbo].[swAuthTable]    Script Date: 10/16/2024 7:29:52 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[swAuthTable](
	[memberid] [numeric](18, 0) IDENTITY(1,1) NOT NULL,
	[id] [uniqueidentifier] NOT NULL,
	[username] [nvarchar](50) NOT NULL,
	[password] [nvarchar](255) NULL,
	[azureAD.id] [nvarchar](50) NULL,
	[azureAD.token] [nvarchar](max) NULL,
	[azureAD.email] [nvarchar](255) NULL,
	[azureAD.name] [nvarchar](128) NULL,
	[azureAD.phone] [nvarchar](16) NULL,
	[azureAD.mobile] [nvarchar](16) NULL,
	[azureAD.username] [nvarchar](255) NULL,
	[azureAD.title] [nvarchar](50) NULL,
	[azureAD.expires] [numeric](18, 0) NULL,
	[azureAD.scope] [nvarchar](255) NULL,
	[azureAD.code_verifier] [nvarchar](50) NULL,
	[azureAD.refreshtoken] [nvarchar](max) NULL,
	[facebook.id] [nvarchar](255) NULL,
	[facebook.token] [nvarchar](2048) NULL,
	[facebook.email] [nvarchar](255) NULL,
	[facebook.name] [nvarchar](255) NULL,
	[google.id] [nvarchar](255) NULL,
	[google.token] [nvarchar](2048) NULL,
	[google.email] [nvarchar](255) NULL,
	[google.name] [nvarchar](255) NULL,
	[linkedin.id] [nvarchar](255) NULL,
	[linkedin.token] [nvarchar](2048) NULL,
	[linkedin.email] [nvarchar](255) NULL,
	[linkedin.name] [nvarchar](255) NULL,
	[twitter.id] [nvarchar](255) NULL,
	[twitter.token] [nvarchar](2048) NULL,
	[twitter.email] [nvarchar](255) NULL,
	[twitter.name] [nvarchar](255) NULL,
	[token.id] [numeric](18, 0) NULL,
	[token.user] [uniqueidentifier] NULL,
	[token.userid] [nvarchar](50) NULL,
	[token.value] [nvarchar](255) NULL,
	[token.expires] [numeric](18, 0) NULL,
	[token.expiresAt] [datetime] NULL,
	[subscriberid] [uniqueidentifier] NULL,
	[clientUUID] [uniqueidentifier] NULL,
	[groups] [bigint] NULL,
	[rights] [bigint] NULL,
	[stripe.id] [nvarchar](255) NULL,
	[stripe.email] [nvarchar](255) NULL,
	[stripe.name] [nvarchar](255) NULL,
	[accesslevel] [bigint] NULL,
	[accountstatus] [int] NULL,
	[appid] [int] NULL,
	[pageid] [int] NULL,
	[token] [nvarchar](255) NULL,
	[createdate] [datetime] NULL
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_UUID]  DEFAULT (newid()) FOR [id]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_subscriberid]  DEFAULT (N'C80E6FFC-910A-4C8F-9B90-C393178EA8F0') FOR [subscriberid]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_groups]  DEFAULT ((1)) FOR [groups]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_rights]  DEFAULT ((1)) FOR [rights]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_accesslevel]  DEFAULT ((1)) FOR [accesslevel]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_accountstatus]  DEFAULT ((1)) FOR [accountstatus]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_appid]  DEFAULT ((2)) FOR [appid]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_pageid]  DEFAULT ((148)) FOR [pageid]
GO

ALTER TABLE [dbo].[swAuthTable] ADD  CONSTRAINT [DF_swAuthTable_createdate]  DEFAULT (getdate()) FOR [createdate]
GO